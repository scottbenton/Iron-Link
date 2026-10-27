import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslation } from "react-i18next";

import { useSnackbar } from "providers/SnackbarProvider";

import { useAdvancedFeatureToggle } from "hooks/advancedFeatures/advancedFeatures";

import { useUID } from "stores/auth.store";

import type { RichTextContentStore } from "services/richTextContent.service";
import { RichTextSecretsService } from "services/richTextSecrets.service";
import type { RoomKeySource } from "services/roomKeys.service";

import { Editor, EditorProps } from "./Editor";
import type {
  RichTextToolbarProps,
  SecretsToolbarState,
} from "./richTextToolbar";
import { secretBlockExtensions } from "./rtcExtensions";
import { SecretBlockView } from "./secrets/SecretBlockView";
import { SecretBlocksExtension } from "./secrets/SecretBlocksExtension";
import { GUIDE_IMAGES_REFUSED_EVENT } from "./secrets/guideImagePasteGuard";
import {
  copyImageIntoSurface,
  guideImageNeedsCopy,
  toGuideImageSrc,
} from "./secrets/guideImages";
import { SecretsController } from "./secrets/secretsController";
import {
  SecretsConfig,
  useSecretsCompanion,
} from "./secrets/useSecretsCompanion";
import { useAutoSaveRtcEditor } from "./useAutosaveRtcEditor";
import { useRoomKey } from "./useRoomKey";

export interface RtcRichTextEditorProps {
  id: string;
  roomPrefix: string;
  // Whose key locks the live room: the note's or entry's own, or a Guide key.
  roomKeySource: RoomKeySource;
  // Where the document is saved; saves merge with what is stored. Without
  // one, the editor is read-only.
  contentStore?: RichTextContentStore;
  onSaveError?: (error: unknown) => void;
  initialValue: Uint8Array;
  Toolbar: React.FC<RichTextToolbarProps>;
  // Guide-only secret blocks, for a Guide of this surface. Players' editors
  // get none, and nothing about secrets reaches them.
  secrets?: SecretsConfig | null;
  // Bordered, with the toolbar inside, for an editor among other inputs.
  outlined?: boolean;
  minHeight?: number;
  // Side padding for the text, so the editor can scroll at its column's edge.
  contentPx?: EditorProps["contentPx"];
  fill?: EditorProps["fill"];
}

export function RtcRichTextEditor(props: RtcRichTextEditorProps) {
  const {
    id,
    roomPrefix,
    roomKeySource,
    contentStore,
    onSaveError,
    initialValue,
    Toolbar,
    outlined,
    minHeight,
    contentPx,
    fill,
  } = props;

  // Adding secrets is an advanced feature. With it off a Guide still sees the
  // secrets a note already has, so nothing hidden in it goes unnoticed.
  const secretsEnabled = useAdvancedFeatureToggle("secrets");
  const secrets = useMemo(
    () =>
      props.secrets && !secretsEnabled
        ? { ...props.secrets, canInsert: false }
        : props.secrets,
    [props.secrets, secretsEnabled],
  );

  const { t } = useTranslation();
  const { error } = useSnackbar();
  const uid = useUID();

  const readOnly = !contentStore;
  const roomKey = useRoomKey(roomKeySource);

  // Secrets are edited exactly where the surface is: a Guide who can't edit
  // the note can't add, change or delete its secrets either.
  const companion = useSecretsCompanion(secrets ?? null, {
    readOnly,
    onSaveError,
  });
  const surfaceRef = useRef(secrets?.surface);
  surfaceRef.current = secrets?.surface;
  const refusedMessage = t(
    "notes.secrets.image-paste-refused",
    "Images from a secret can't be pasted into the note. Players can't see them.",
  );
  const refusedMessageRef = useRef(refusedMessage);
  refusedMessageRef.current = refusedMessage;
  const copyFailedMessage = t(
    "notes.secrets.image-copy-failed",
    "An image couldn't be moved into the secret's private storage. Players can still open it from its old link.",
  );
  const copyFailedMessageRef = useRef(copyFailedMessage);
  copyFailedMessageRef.current = copyFailedMessage;

  const controller = useMemo(
    () =>
      companion.doc
        ? new SecretsController({
            companion: companion.doc,
            userId: uid,
            blockExtensions: secretBlockExtensions,
            readOnly,
            // A note image or another surface's secret image that lands in
            // a block is copied into this surface's private storage.
            images: {
              needsCopy: (src) =>
                !!surfaceRef.current &&
                guideImageNeedsCopy(surfaceRef.current, src),
              copy: (src) =>
                surfaceRef.current
                  ? copyImageIntoSurface(surfaceRef.current, src)
                  : Promise.reject(new Error("No surface")),
              onCopyFailed: () => error(copyFailedMessageRef.current),
            },
          })
        : null,
    // The user only changes on sign-out, which closes the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companion.doc, readOnly],
  );
  useEffect(() => () => controller?.destroy(), [controller]);

  const controllerRef = useRef(controller);
  controllerRef.current = controller;
  const hasSecrets = !!secrets;
  // Stable for the editor's life: the controller is read when needed.
  const extensions = useMemo(
    () =>
      hasSecrets
        ? [
            SecretBlocksExtension.configure({
              getController: () => controllerRef.current,
            }),
          ]
        : undefined,
    [hasSecrets],
  );

  const { editor, saving } = useAutoSaveRtcEditor({
    documentId: id,
    roomName: `${roomPrefix}-${id}`,
    roomKey,
    initialValue,
    contentStore,
    onSaveError,
    extensions,
  });

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onRefused = () => error(refusedMessageRef.current);
    dom.addEventListener(GUIDE_IMAGES_REFUSED_EVENT, onRefused);
    return () => dom.removeEventListener(GUIDE_IMAGES_REFUSED_EVENT, onRefused);
  }, [editor, error]);

  useEffect(() => {
    if (!controller || !editor) return;
    controller.attachShared(editor);
    return () => controller.detachShared(editor);
  }, [controller, editor]);

  const subscribe = useCallback(
    (listener: () => void) => controller?.subscribe(listener) ?? (() => {}),
    [controller],
  );
  const snapshot = useSyncExternalStore(
    subscribe,
    () => controller?.getSnapshot() ?? null,
  );
  const blocks = useMemo(
    () => controller?.getBlocks() ?? [],
    // The snapshot changes whenever the blocks do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controller, snapshot?.version],
  );
  const activeBlockEditor = snapshot?.activeBlockId
    ? (controller?.getActiveEditor() ?? null)
    : null;

  // The shared editor re-renders on its own transactions; follow its
  // selection here too, for Make secret.
  const [hasSelection, setHasSelection] = useState(false);
  useEffect(() => {
    if (!editor || !controller) return;
    const update = () => setHasSelection(!editor.state.selection.empty);
    editor.on("selectionUpdate", update);
    return () => {
      editor.off("selectionUpdate", update);
    };
  }, [editor, controller]);

  const surface = secrets?.surface;
  const secretsToolbar = useMemo<SecretsToolbarState | undefined>(() => {
    if (!controller || !secrets || !surface) return undefined;
    return {
      inSecret: !!activeBlockEditor,
      canInsert: secrets.canInsert && !readOnly,
      insertSecret: () => controller.insertSecret(),
      canMakeSecret:
        secrets.canInsert && !activeBlockEditor && !readOnly && hasSelection,
      makeSecret: () => controller.makeSecret(),
      uploadImage: (file) =>
        RichTextSecretsService.storeImage(surface, file).then(toGuideImageSrc),
    };
  }, [controller, secrets, surface, activeBlockEditor, readOnly, hasSelection]);

  const onBlockMounted = useCallback(
    (blockId: string) => controller?.takePendingFocus(blockId),
    [controller],
  );
  const deleteBlock = useCallback(
    (blockId: string) => controller?.deleteBlock(blockId),
    [controller],
  );

  return (
    <>
      <Editor
        editable={!readOnly}
        editor={editor}
        toolbarEditor={activeBlockEditor}
        secrets={secretsToolbar}
        saving={saving || companion.saving}
        Toolbar={Toolbar}
        outlined={outlined}
        minHeight={minHeight}
        contentPx={contentPx}
        fill={fill}
      />
      {blocks.map((block) => (
        <SecretBlockView
          key={block.id}
          block={block}
          onMounted={onBlockMounted}
          sharedOnlyWith={secrets?.sharedOnlyWith ?? null}
          onDelete={readOnly ? undefined : deleteBlock}
        />
      ))}
    </>
  );
}
