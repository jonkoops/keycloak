import { Breadcrumb, BreadcrumbItem } from "@patternfly/react-core";
import { useMatches } from "react-router-dom";

export function PageBreadCrumbs() {
  const matches = useMatches();
  const crumbs = matches
    // first get rid of any matches that don't have handle and crumb
    .filter((match) => Boolean(match.handle?.crumb))
    // now map them into an array of elements, passing the loader
    // data to each one
    .map((match) => match.handle.crumb(match.data));

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      {crumbs.map((crumb, index) => {
        const isLast = crumbs.length - 1 === index;

        return (
          <BreadcrumbItem key={index} isActive={isLast}>
            {crumb}
          </BreadcrumbItem>
        );
      })}
    </Breadcrumb>
  );
}
