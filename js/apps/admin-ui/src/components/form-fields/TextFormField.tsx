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
  required?: boolean;
}

export function TextFormField<
  T extends FieldValues,
  P extends FieldPath<T> = FieldPath<T>,
>({ label, type, required, ...props }: TextFormFieldProps<T, P>) {
  const defaultValue = props.defaultValue ?? ("" as PathValue<T, P>);
  const { field, fieldState } = useController({ ...props, defaultValue });
  const { id, formGroupProps } = useFormField({ label, fieldState, required });

  return (
    <FormGroup {...formGroupProps}>
      <KeycloakTextInput
        id={id}
        type={type}
        {...props}
        {...field}
        // Looks like there are two ways to set required, so we'll set both.
        required={required}
        isRequired={required}
      />
    </FormGroup>
  );
}
