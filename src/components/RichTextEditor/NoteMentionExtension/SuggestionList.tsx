import {
  List,
  ListItem,
  ListItemButton,
  ListSubheader,
  Paper,
} from "@mui/material";
import type { MentionNodeAttrs } from "@tiptap/extension-mention";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import {
  Fragment,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import type { MentionKind, MentionSuggestion } from "./otherNoteOptions";

export type SuggestionListRef = {
  // For convenience using this SuggestionList from within the
  // mentionSuggestionOptions, we'll match the signature of SuggestionOptions's
  // `onKeyDown` returned in its `render` function
  onKeyDown: NonNullable<
    ReturnType<
      NonNullable<SuggestionOptions<MentionSuggestion>["render"]>
    >["onKeyDown"]
  >;
};

export type SuggestionListProps = SuggestionProps<MentionSuggestion>;

const SuggestionList = forwardRef<SuggestionListRef, SuggestionListProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      if (index >= props.items.length) {
        // Make sure we actually have enough items to select the given index. For
        // instance, if a user presses "Enter" when there are no options, the index will
        // be 0 but there won't be any items, so just ignore the callback here
        return;
      }

      const suggestion = props.items[index];

      // Set all of the attributes of our Mention node based on the suggestion
      // data. The fields of `suggestion` will depend on whatever data you
      // return from your `items` function in your "suggestion" options handler.
      // Our suggestion handler returns `MentionSuggestion`s (which we've
      // indicated via SuggestionProps<MentionSuggestion>). We are passing an
      // object of the `MentionNodeAttrs` shape when calling `command` (utilized
      // by the Mention extension to create a Mention Node).
      // A world entry's name is never stored in the note: it is read live, so
      // a rename shows everywhere and a hidden entry never reveals its name.
      const mentionItem: MentionNodeAttrs & { kind: MentionKind } = {
        id: suggestion.id,
        label:
          suggestion.kind === "worldEntry" ? null : suggestion.mentionLabel,
        kind: suggestion.kind,
      };
      props.command(mentionItem);
    };

    const upHandler = () => {
      setSelectedIndex(
        (selectedIndex + props.items.length - 1) % props.items.length,
      );
    };

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
      selectItem(selectedIndex);
    };

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          upHandler();
          return true;
        }

        if (event.key === "ArrowDown") {
          downHandler();
          return true;
        }

        if (event.key === "Enter") {
          enterHandler();
          return true;
        }

        return false;
      },
    }));

    return props.items.length > 0 ? (
      <Paper elevation={5}>
        <List
          dense
          sx={{
            // In case there are contiguous stretches of long text that can't wrap:
            overflow: "hidden",
          }}
        >
          {props.items.map((item, index) => (
            <Fragment key={`${item.kind}:${item.id}`}>
              {item.group !== props.items[index - 1]?.group && (
                <ListSubheader sx={{ lineHeight: "32px" }}>
                  {item.group}
                </ListSubheader>
              )}
              <ListItem disablePadding>
                <ListItemButton
                  selected={index === selectedIndex}
                  onClick={() => {
                    selectItem(index);
                  }}
                >
                  {item.mentionLabel}
                </ListItemButton>
              </ListItem>
            </Fragment>
          ))}
        </List>
      </Paper>
    ) : null;
  },
);

SuggestionList.displayName = "SuggestionList";

export default SuggestionList;
