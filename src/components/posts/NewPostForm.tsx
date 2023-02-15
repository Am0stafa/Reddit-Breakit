import {
  Alert,
  AlertIcon,
  Flex,
  Icon,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import CryptoJS from "crypto-js";
import { User } from "firebase/auth";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadString } from "firebase/storage";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { BiPoll } from "react-icons/bi";
import { BsLink45Deg, BsMic } from "react-icons/bs";
import { IoDocumentText, IoImageOutline } from "react-icons/io5";

import { Post } from "../../atoms/PostAtom";
import { firestore, storage } from "../../firebase/clientApp";
import useSelectFile from "../../hooks/useSelectFile";
import ImageUpload from "./postsForm/ImageUpload";
import TextInput from "./postsForm/TextInput";
import TabItems from "./TabItems";

// const secretPass = process.env.NEXT_PUBLIC_CRYPTO_SECRET_PASS;

type NewPostFormProps = {
  user: User;
  communityImageURL?: string;
};

const formTabs = [
  {
    title: "Post",
    icon: IoDocumentText,
  },
  {
    title: "Images & Video",
    icon: IoImageOutline,
  },
  {
    title: "Link",
    icon: BsLink45Deg,
  },
  {
    title: "Poll",
    icon: BiPoll,
  },
  {
    title: "Talk",
    icon: BsMic,
  },
];

export type TabItem = {
  title: string;
  icon: typeof Icon.arguments;
};

const NewPostForm: React.FC<NewPostFormProps> = ({ user,communityImageURL }) => {
  const router = useRouter();
  
  const [selectedTab, setSelectTab] = useState(formTabs[0].title); //To track which tab item is currently selected
  const [textInput, setTextInput] = useState({
    title: "",
    body: "",
  });
  const [encryptedData, setEncryptedData] = useState({
    title: "",
    body: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  //const [selectedFile, setSelectedFile] = useState<string>();

  const { selectedFile, setSelectedFile, onSelectedFile } = useSelectFile();
  const bg = useColorModeValue("white", "#1A202C");

  //creates the post and send it to firebase
  const handleCreatePost = async () => {
    /*
     * 1) construct the post object
     * 2) store the post in the post collection
     * 3) check to see if the user included an image and if they do so we store it in firebase storage
     * 4) update the post doc by adding the image url
     * 5) redirect the user back to the community page
     */

    const { communityId } = router.query;

    const splitName = user.email!.split("@")[0];

    // we encrypt 3 fields title, body and image url

    const newPost: Post = {
      communityId: communityId as string,
      creatorId: user.uid,
      communityImageURL: communityImageURL || "",
      creatorDisplayName: splitName,
      title: encryptedData.title,
      body: encryptedData.body,
      numberOfComments: 0,
      voteStatus: 0,
      createdAt: serverTimestamp() as Timestamp,
    };

    setLoading(true);
    try {
      // store the post in db
      const postDocRef = await addDoc(collection(firestore, "posts"), newPost);

      if (selectedFile) {
        // save the image to the db
        const imageRef = ref(storage, `posts/${postDocRef.id}/image`);
        await uploadString(imageRef, selectedFile, "data_url");
        const downloadURL = await getDownloadURL(imageRef);

        const encryptDownloadURL = CryptoJS.AES.encrypt( JSON.stringify(downloadURL), process.env.NEXT_PUBLIC_CRYPTO_SECRET_PASS as string ).toString();
        
        console.log("ImageURL encrypted successfully");

        await updateDoc(postDocRef, {
          imageURL: encryptDownloadURL,
        });
      }
      
      //back to home page
      router.back();
    } catch (error: any) {
      console.log(error.message);
      setError(true);
    }
    setLoading(false);
  };

  // what happens when you enter something into the input field
  const onTextChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { target: { name, value }} = event; // destructure what we need from the event

    encryptData(name, value);

    setTextInput((prev) => ({
        ...prev,
        [name]: value, //only update the field that updated that event
    }));
 };

  const encryptData = (name: string, value: string) => {
    //encrypt a single key value

    try {
      const data = CryptoJS.AES.encrypt(JSON.stringify(value), "ChristofPaar").toString();

      console.log("data encrypted successfully!");

      setEncryptedData((prev) => ({
        ...prev,
        [name]: data,
      }));
    } catch (error) {
      console.log(error);
    }
  };




  return (
    <Flex direction="column" bg={bg} borderRadius={4} mt={2}>

      <Flex width="100%">
        {formTabs.map((item) => (
          <TabItems
            key={item.title}
            item={item}
            selected={item.title === selectedTab} // boolean which represent if this particular tab item is selected
            setSelectTab={setSelectTab}
          />
        ))}
      </Flex>

      <Flex p={4}>
        {selectedTab === "Post" && (
          <TextInput
            textInputs={textInput}
            onChange={onTextChange}
            handleCreatePost={handleCreatePost}
            loading={loading}
          />
        )}

        {selectedTab === "Images & Video" && (
          <ImageUpload
            selectedFile={selectedFile}
            onSelectedImage={onSelectedFile}
            setSelectTab={setSelectTab}
            setSelectedFile={setSelectedFile}
          />
        )}
      </Flex>

      {error && (
        <Alert status="error">
          <AlertIcon />
          <Text mr={2}>Error Creating Post</Text>
        </Alert>
      )}

    </Flex>
  );
};
export default NewPostForm;
