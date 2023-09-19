import { type ControllerFieldState } from "react-hook-form";

export function useErrorMessage({ error }: ControllerFieldState) {
  if (!error) {
    return;
  }

  if (error.message) {
    return error.message;
  }
}
