import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FC, useEffect, useRef, useState } from "react";
import { CustomToolbar } from "./CustomToolbar";

// 👇 Import Quill to access the font format
import Quill, { QuillOptionsStatic } from "quill";
import { BsJustify } from "react-icons/bs";

type EditorProps = {
  value: string;
  onChange: (html: string, plain: string) => void;
  style?: React.CSSProperties;
  modules?: QuillOptionsStatic["modules"];
  formats?: string[];
};

const defaultFormats = ["header", "bold", "italic", "underline", "list", "bullet", "link","blockquote"];

const defaultModules = {
  toolbar: {
    container: "#custom-toolbar",
  },
};


const Editor: FC<EditorProps & { style?: React.CSSProperties }> = ({ value, onChange, style }) => {
  const [internalValue, setInternalValue] = useState(value);
  const quillRef = useRef<ReactQuill | null>(null);

  useEffect(() => {
    const Font = Quill.import("formats/font") as any;
    Font.whitelist = ["sans-serif", "serif", "monospace"];
    Quill.register(Font, true);
  }, []);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (val: string) => {
    setInternalValue(val);
    const plainText = quillRef.current?.getEditor().getText().trim() || "";
    onChange(val, plainText);
  };

  return (
    <div className="rounded-lg space-y-2 bg-gray-100 p-3 overflow-y-auto">
      <CustomToolbar />
      <ReactQuill
        ref={quillRef}
        value={internalValue}
        onChange={handleChange}
        modules={defaultModules}
        formats={defaultFormats}
        style={style}
        className="border-none rounded-md text-sm h-[450px] resize-true"
        theme="snow"
        placeholder="Write job description here"
      />
    </div>
  );
};

export default Editor;
