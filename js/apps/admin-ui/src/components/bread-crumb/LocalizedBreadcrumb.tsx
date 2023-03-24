import { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";

export type LocalizedBreadcrumbProps = {
  key: string;
};

export const LocalizedBreadcrumb: FunctionComponent<
  LocalizedBreadcrumbProps
> = ({ key }) => {
  const { t } = useTranslation(key);
  return <>{t(key)}</>;
};
