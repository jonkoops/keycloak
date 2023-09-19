import { type FormGroupProps } from "@patternfly/react-core";
import { useId } from "react";
import { type ControllerFieldState } from "react-hook-form";

export type UseFormFieldProps = {
  label: string;
  fieldState: ControllerFieldState;
  required?: boolean;
};

export function useFormField({
  label,
  fieldState,
  required = false,
}: UseFormFieldProps) {
  const id = useId();
  const errorMessage = fieldState.error?.message;
  const formGroupProps: FormGroupProps = {
    label,
    fieldId: id,
    validated: fieldState.invalid ? "error" : "default",
    helperTextInvalid: errorMessage,
    // Looks like there are two ways to set required, so we'll set both.
    required,
    isRequired: required,
  };

  return {
    id,
    formGroupProps,
  };
}
