import { FormGroup } from "@patternfly/react-core";
import {
  useController,
  type FieldPath,
  type FieldValues,
  type PathValue,
  type UseControllerProps,
} from "react-hook-form";
import {
  KeycloakTextInput,
  type KeycloakTextInputProps,
} from "../keycloak-text-input/KeycloakTextInput";
import { useFormField } from "./useFormField";

export interface TextFormFieldProps<
  T extends FieldValues,
  P extends FieldPath<T> = FieldPath<T>,
> extends UseControllerProps<T, P> {
  label: string;
  type?: KeycloakTextInputProps["type"];
}

export function TextFormField<
  T extends FieldValues,
  P extends FieldPath<T> = FieldPath<T>,
>({ label, type, ...props }: TextFormFieldProps<T, P>) {
  const defaultValue = props.defaultValue ?? ("" as PathValue<T, P>);
  const { field, fieldState } = useController({ ...props, defaultValue });
  const { id, formGroupProps } = useFormField({ label, fieldState });

  return (
    <FormGroup {...formGroupProps}>
      <KeycloakTextInput id={id} type={type} {...props} {...field} />
    </FormGroup>
  );
}
