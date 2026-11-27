import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Accordion, AccordionItem, AccordionTrigger } from "../../Accordion";
import { Dialog, DialogBody, DialogHeader } from "../../Dialog";
import { HeadingOffset } from "../HeadingOffset";
import { useHeadingComponent } from "../useHeadingComponent";

function Heading(props: { level: number; children: string }) {
  const Component = useHeadingComponent(props.level);
  return <Component>{props.children}</Component>;
}

describe("HeadingOffset", () => {
  it("shifts the library's own headings too", () => {
    render(
      <HeadingOffset offset={2}>
        <Accordion>
          <AccordionItem>
            <AccordionTrigger headingLevel={3}>Stats</AccordionTrigger>
          </AccordionItem>
        </Accordion>
      </HeadingOffset>,
    );
    expect(
      screen.getByRole("heading", { name: "Stats", level: 5 }),
    ).toBeVisible();
  });

  it("starts again inside a dialog", async () => {
    render(
      <HeadingOffset offset={2}>
        <Dialog open onClose={() => {}}>
          <DialogHeader title="Edit World" />
          <DialogBody>
            <Heading level={3}>Truths</Heading>
          </DialogBody>
        </Dialog>
      </HeadingOffset>,
    );
    expect(
      await screen.findByRole("heading", { name: "Truths", level: 3 }),
    ).toBeInTheDocument();
  });
});
