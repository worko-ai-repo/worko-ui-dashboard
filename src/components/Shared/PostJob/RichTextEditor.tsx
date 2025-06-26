import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { FC, useEffect, useRef, useState } from "react";
import { CustomToolbar } from "./CustomToolbar";

// 👇 Import Quill to access the font format
import Quill from "quill";

type EditorProps = {
  value: string;
  onChange: (html: string, plain: string) => void;
};

const formats = ["bold", "italic", "underline", "list", "bullet", "link", "blockquote"];

const modules = {
  toolbar: {
    container: "#custom-toolbar",
  },
};

const Editor: FC<EditorProps> = ({ value, onChange }) => {
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
    // debugger;
    onChange(val, plainText);
  };

  return (
    <div className="rounded-lg space-y-2 bg-gray-100 p-3 min-h-[450px] overflow-y-auto">
      <CustomToolbar />
      <ReactQuill ref={quillRef} value={internalValue} onChange={handleChange} modules={modules} formats={formats} className="border-none rounded-md text-sm h-[450px] resize-true" theme="snow" placeholder="Write job description here" />
    </div>
  );
};

export default Editor;