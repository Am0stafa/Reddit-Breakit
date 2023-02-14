import {
  Button,
  Flex,
  Image,
  Stack,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useRef } from "react";

type ImageUploadProps = {
  selectedFile?: string;
  onSelectedImage: (event: React.ChangeEvent<HTMLInputElement>) => void;
  setSelectTab: (value: string) => void; // to toggle between tabs
  setSelectedFile: (value: string) => void;
};

const ImageUpload: React.FC<ImageUploadProps> = ({ selectedFile,onSelectedImage,setSelectTab,setSelectedFile }) => {
  const selectedFileRef = useRef<HTMLInputElement>(null); //what we want to do is hide the input and have our button click behind the sense the input

  const searchBorder = useColorModeValue("gray.200", "#718096");

  return (
    <Flex direction="column" justify="center" align="center" width="100%">
      {selectedFile ? (
        <>
          <Image src={selectedFile} maxWidth="400px" maxHeight="400px" alt='User selected photo' />
          <Stack direction="row" mt={4}>
            <Button height="28px" onClick={() => setSelectTab("Post")}>
              Back to Post
            </Button>

            <Button
              variant="outline"
              height="28px"
              onClick={() => setSelectedFile("")}
            >
              Remove
            </Button>
          </Stack>
        </>
      ) : (
        <Flex
          justify="center"
          align="center"
          p={20}
          border="1px dashed"
          borderColor={searchBorder}
          width="100%"
          borderRadius={4}
        >
          <Button
            variant="outline"
            height="28px"
            onClick={() => selectedFileRef.current?.click()} // implicitly click on that input
          >
            Upload
          </Button>

          <input
            ref={selectedFileRef}
            type="file"
            hidden
            onChange={onSelectedImage}
          />
        </Flex>
      )}
    </Flex>
  );
};
export default ImageUpload;
