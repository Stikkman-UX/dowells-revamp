import type { FieldProps } from "./types";
import { TextLikeField } from "./fields/TextLikeField";
import { BooleanField } from "./fields/BooleanField";
import { SelectField } from "./fields/SelectField";
import { StringListField } from "./fields/StringListField";
import { HighlightTextField } from "./fields/HighlightTextField";
import { ButtonField } from "./fields/ButtonField";
import { MediaField } from "./fields/MediaField";
import { GroupField } from "./fields/GroupField";
import { RepeaterField } from "./fields/RepeaterField";
import { CustomField } from "./fields/CustomField";

/** Dispatches a single `Field` + its value/onChange/path/errors to the right editor. */
export function FieldRenderer(props: FieldProps) {
  switch (props.field.kind) {
    case "text":
    case "textarea":
    case "url":
      return <TextLikeField {...props} />;
    case "boolean":
      return <BooleanField {...props} />;
    case "select":
      return <SelectField {...props} />;
    case "stringList":
      return <StringListField {...props} />;
    case "highlightText":
      return <HighlightTextField {...props} />;
    case "button":
      return <ButtonField {...props} />;
    case "media":
      return <MediaField {...props} />;
    case "group":
      return <GroupField {...props} />;
    case "repeater":
      return <RepeaterField {...props} />;
    case "custom":
      return <CustomField {...props} />;
    default:
      return null;
  }
}
