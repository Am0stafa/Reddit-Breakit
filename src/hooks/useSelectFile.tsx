import React, { useState } from "react";

const useSelectFile = () => {
  const [selectedFile, setSelectedFile] = useState<string>();

  //storing the image in a state and then displaying it
  const onSelectedFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader(); // class for reading the file data

    if (event.target.files?.[0]) {
      reader.readAsDataURL(event.target.files[0]);
    }

    // after the reader finish reading we want to store in state
    reader.onload = (readerEvent) => {
      if (readerEvent.target?.result) {
        setSelectedFile(readerEvent.target.result as string); // this string if passed to an html image would show
      }
    };
  };

  return { selectedFile, setSelectedFile, onSelectedFile };
};
export default useSelectFile;
