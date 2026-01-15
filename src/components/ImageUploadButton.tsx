/**
 * Image Upload Button Component (SolidJS)
 */

import { UploadPicture } from "./ui/icons";
import NavButton from "./NavButton";

interface ImageUploadButtonProps {
  onImageSelected: (file: File) => void;
}

export default function ImageUploadButton(props: ImageUploadButtonProps) {
  let fileInputRef: HTMLInputElement | undefined;

  const handleFileChange = (e: Event) => {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      props.onImageSelected(file);
      if (fileInputRef) {
        fileInputRef.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef?.click();
  };

  return (
    <>
      <NavButton text="Upload image" onClick={handleClick} icon={<UploadPicture />} />
      <input
        ref={(el) => (fileInputRef = el)}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </>
  );
}
