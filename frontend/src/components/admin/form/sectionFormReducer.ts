import { setIn } from "./path";

export type SectionFormStatus = "idle" | "saved" | "conflict" | "error";

export type SectionFormState = {
  data: unknown;
  isVisible: boolean;
  rev: number;
  dirty: boolean;
  saving: boolean;
  errors: Record<string, string>;
  status: SectionFormStatus;
  errorMessage?: string;
  /** Last-saved snapshot, used by Reset — never sent to the API directly. */
  savedData: unknown;
  savedIsVisible: boolean;
};

export type SectionFormAction =
  | { type: "SET_FIELD"; name: string; value: unknown }
  | { type: "SET_VISIBLE"; value: boolean }
  | { type: "SAVE_START" }
  | { type: "SAVE_SUCCESS"; data: unknown; isVisible: boolean; rev: number }
  | { type: "SAVE_VALIDATION_ERROR"; errors: Record<string, string>; message?: string }
  | { type: "SAVE_CONFLICT" }
  | { type: "SAVE_OTHER_ERROR"; message: string }
  | { type: "RESET" }
  | { type: "RELOAD"; data: unknown; isVisible: boolean; rev: number };

export function initSectionFormState(initial: {
  data: unknown;
  isVisible: boolean;
  rev: number;
}): SectionFormState {
  return {
    data: initial.data,
    isVisible: initial.isVisible,
    rev: initial.rev,
    savedData: initial.data,
    savedIsVisible: initial.isVisible,
    dirty: false,
    saving: false,
    errors: {},
    status: "idle",
  };
}

export function sectionFormReducer(
  state: SectionFormState,
  action: SectionFormAction
): SectionFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, data: setIn(state.data, action.name, action.value), dirty: true, status: "idle" };
    case "SET_VISIBLE":
      return { ...state, isVisible: action.value, dirty: true, status: "idle" };
    case "SAVE_START":
      return { ...state, saving: true, errors: {}, errorMessage: undefined, status: "idle" };
    case "SAVE_SUCCESS":
      return {
        ...state,
        data: action.data,
        isVisible: action.isVisible,
        rev: action.rev,
        savedData: action.data,
        savedIsVisible: action.isVisible,
        dirty: false,
        saving: false,
        errors: {},
        status: "saved",
      };
    case "SAVE_VALIDATION_ERROR":
      return {
        ...state,
        saving: false,
        errors: action.errors,
        errorMessage: action.message,
        status: "error",
      };
    case "SAVE_CONFLICT":
      return { ...state, saving: false, status: "conflict" };
    case "SAVE_OTHER_ERROR":
      return { ...state, saving: false, status: "error", errorMessage: action.message };
    case "RESET":
      return {
        ...state,
        data: state.savedData,
        isVisible: state.savedIsVisible,
        dirty: false,
        errors: {},
        status: "idle",
      };
    case "RELOAD":
      return {
        ...state,
        data: action.data,
        isVisible: action.isVisible,
        rev: action.rev,
        savedData: action.data,
        savedIsVisible: action.isVisible,
        dirty: false,
        errors: {},
        status: "idle",
      };
    default:
      return state;
  }
}
