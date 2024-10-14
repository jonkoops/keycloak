import { HTMLProps } from "react";
import { FormTitle } from "./FormTitle";

type ScrollPanelProps = HTMLProps<HTMLFormElement> & {
  title: string;
  scrollId: string;
};

export const ScrollPanel = (props: ScrollPanelProps) => {
  const { title, children, scrollId, ...rest } = props;
  return (
    <section {...rest} style={{ marginTop: "var(--pf-v5-global--spacer--lg)" }}>
      <>
        <FormTitle id={scrollId} title={title} />
        {children}
      </>
    </section>
  );
};
