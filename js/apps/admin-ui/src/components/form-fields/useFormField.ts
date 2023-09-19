import { type FormGroupProps } from "@patternfly/react-core";
import { useId } from "react";
import { type ControllerFieldState } from "react-hook-form";
import { useErrorMessage } from "./useErrorMessage";

export type UseFormFieldProps = {
  label: string;
  fieldState: ControllerFieldState;
};

export function useFormField({ label, fieldState }: UseFormFieldProps) {
  const id = useId();
  const errorMessage = useErrorMessage(fieldState);
  const formGroupProps: FormGroupProps = {
    label,
    fieldId: id,
    validated: fieldState.invalid ? "error" : "default",
    helperTextInvalid: errorMessage,
  };

  return {
    id,
    formGroupProps,
  };
}
