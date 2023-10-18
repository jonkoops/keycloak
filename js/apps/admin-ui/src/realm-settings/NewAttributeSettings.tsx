import type {
  UserProfileAttribute,
  UserProfileConfig,
} from "@keycloak/keycloak-admin-client/lib/defs/userProfileConfig";
import {
  AlertVariant,
  Button,
  Form,
  PageSection,
} from "@patternfly/react-core";
import { flatten } from "flat";
import { useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { adminClient } from "../admin-client";
import { useAlerts } from "../components/alert/Alerts";
import { FixedButtonsGroup } from "../components/form/FixedButtonGroup";
import { ScrollForm } from "../components/scroll-form/ScrollForm";
import { ViewHeader } from "../components/view-header/ViewHeader";
import { convertToFormValues } from "../util";
import { useFetch } from "../utils/useFetch";
import { useParams } from "../utils/useParams";
import type { AttributeParams } from "./routes/Attribute";
import { toUserProfile } from "./routes/UserProfile";
import { UserProfileProvider } from "./user-profile/UserProfileContext";
import { AttributeAnnotations } from "./user-profile/attribute/AttributeAnnotations";
import { AttributeGeneralSettings } from "./user-profile/attribute/AttributeGeneralSettings";
import { AttributePermission } from "./user-profile/attribute/AttributePermission";
import { AttributeValidations } from "./user-profile/attribute/AttributeValidations";

import "./realm-settings-section.css";

type IndexedAnnotations = {
  key: string;
  value?: Record<string, unknown>;
};

export type IndexedValidations = {
  key: string;
  value?: Record<string, unknown>;
};

type UserProfileAttributeFormFields = Omit<
  UserProfileAttribute,
  "validations" | "annotations"
> &
  Attribute &
  Permission & {
    validations: IndexedValidations[];
    annotations: IndexedAnnotations[];
    hasSelector: boolean;
    hasRequiredScopes: boolean;
  };

type Attribute = {
  roles: string[];
  scopes: string[];
  isRequired: boolean;
};

type Permission = {
  view: PermissionView[];
  edit: PermissionEdit[];
};

type PermissionView = [
  {
    adminView: boolean;
    userView: boolean;
  },
];

type PermissionEdit = [
  {
    adminEdit: boolean;
    userEdit: boolean;
  },
];

export const USERNAME_EMAIL = ["username", "email"];

const CreateAttributeFormContent = ({
  save,
}: {
  save: (profileConfig: UserProfileConfig) => void;
}) => {
  const { t } = useTranslation();
  const form = useFormContext();
  const { realm, attributeName } = useParams<AttributeParams>();
  const editMode = attributeName ? true : false;

  return (
    <UserProfileProvider>
      <ScrollForm
        sections={[
          { title: t("generalSettings"), panel: <AttributeGeneralSettings /> },
          { title: t("permission"), panel: <AttributePermission /> },
          { title: t("validations"), panel: <AttributeValidations /> },
          { title: t("annotations"), panel: <AttributeAnnotations /> },
        ]}
      />
      <Form onSubmit={form.handleSubmit(save)}>
        <FixedButtonsGroup name="attribute-settings">
          <Button
            variant="primary"
            type="submit"
            data-testid="attribute-create"
          >
            {editMode ? t("save") : t("create")}
          </Button>
          <Link
            to={toUserProfile({ realm, tab: "attributes" })}
            data-testid="attribute-cancel"
            className="kc-attributeCancel"
          >
            {t("cancel")}
          </Link>
        </FixedButtonsGroup>
      </Form>
    </UserProfileProvider>
  );
};

export default function NewAttributeSettings() {
  const { realm, attributeName } = useParams<AttributeParams>();
  const form = useForm<UserProfileAttributeFormFields>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addAlert, addError } = useAlerts();
  const [config, setConfig] = useState<UserProfileConfig | null>(null);
  const editMode = attributeName ? true : false;

  useFetch(
    () => adminClient.users.getProfile(),
    (config) => {
      setConfig(config);
      const {
        annotations,
        validations,
        permissions,
        selector,
        required,
        ...values
      } = config.attributes!.find(
        (attribute) => attribute.name === attributeName,
      ) || { permissions: { edit: ["admin"] } };
      convertToFormValues(
        {
          ...values,
          hasSelector: typeof selector !== "undefined",
          hasRequiredScopes: typeof required?.scopes !== "undefined",
        },
        form.setValue,
      );
      Object.entries(
        flatten<any, any>({ permissions, selector, required }, { safe: true }),
      ).map(([key, value]) => form.setValue(key as any, value));
      form.setValue(
        "annotations",
        Object.entries(annotations || {}).map(([key, value]) => ({
          key,
          value: value as Record<string, unknown>,
        })),
      );
      form.setValue(
        "validations",
        Object.entries(validations || {}).map(([key, value]) => ({
          key,
          value: value as Record<string, unknown>,
        })),
      );
      form.setValue("isRequired", required !== undefined);
    },
    [],
  );

  const save = async (formFields: UserProfileAttributeFormFields) => {
    if (!formFields.hasSelector) {
      delete formFields.selector;
    }

    if (!formFields.hasRequiredScopes) {
      delete formFields.required?.scopes;
    }

    const validations = formFields.validations.reduce(
      (prevValidations, currentValidations) => {
        prevValidations[currentValidations.key] =
          currentValidations.value || {};
        return prevValidations;
      },
      {} as Record<string, unknown>,
    );

    const annotations = formFields.annotations.reduce(
      (obj, item) => Object.assign(obj, { [item.key]: item.value }),
      {},
    );

    const patchAttributes = () =>
      config?.attributes!.map((attribute) => {
        if (attribute.name !== attributeName) {
          return attribute;
        }

        delete attribute.required;
        return Object.assign(
          {
            ...attribute,
            name: attributeName,
            displayName: formFields.displayName!,
            selector: formFields.selector,
            permissions: formFields.permissions!,
            annotations,
            validations,
          },
          formFields.isRequired ? { required: formFields.required } : undefined,
          formFields.group ? { group: formFields.group } : { group: null },
        );
      });

    const addAttribute = () =>
      config?.attributes!.concat([
        Object.assign(
          {
            name: formFields.name,
            displayName: formFields.displayName!,
            required: formFields.isRequired ? formFields.required : undefined,
            selector: formFields.selector,
            permissions: formFields.permissions!,
            annotations,
            validations,
          },
          formFields.isRequired ? { required: formFields.required } : undefined,
          formFields.group ? { group: formFields.group } : undefined,
        ),
      ] as UserProfileAttribute);

    const updatedAttributes = editMode ? patchAttributes() : addAttribute();

    try {
      await adminClient.users.updateProfile({
        ...config,
        attributes: updatedAttributes as UserProfileAttribute[],
        realm,
      });

      navigate(toUserProfile({ realm, tab: "attributes" }));

      addAlert(t("createAttributeSuccess"), AlertVariant.success);
    } catch (error) {
      addError("createAttributeError", error);
    }
  };

  return (
    <FormProvider {...form}>
      <ViewHeader
        titleKey={editMode ? attributeName : t("createAttribute")}
        subKey={editMode ? "" : t("createAttributeSubTitle")}
      />
      <PageSection variant="light">
        <CreateAttributeFormContent save={() => form.handleSubmit(save)()} />
      </PageSection>
    </FormProvider>
  );
}
