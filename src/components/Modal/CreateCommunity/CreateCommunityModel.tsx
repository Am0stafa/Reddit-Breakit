import {
    Box,
    Button,
    Checkbox,
    Flex,
    Icon,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    useColorModeValue,
  } from "@chakra-ui/react";
  
  import {
    doc,
    runTransaction,
    serverTimestamp,
    Timestamp,
  } from "firebase/firestore";
  
  import { useRouter } from "next/router";
  
  import React, { useState } from "react";
  import { useAuthState } from "react-firebase-hooks/auth";
  import { BsFillEyeFill, BsFillPersonFill } from "react-icons/bs";
  import { HiLockClosed } from "react-icons/hi";
  
  import { auth, firestore } from "../../../firebase/clientApp";
  import useDirectory from "../../../hooks/useDirectory";
  
  type CreateCommunityModelProps = {
    open: boolean;
    handleClose: () => void; //just a callback function that does not return anything
  };
  
  const CreateCommunityModel: React.FC<CreateCommunityModelProps> = ({ open,handleClose }) => {
    const [user] = useAuthState(auth);
  
    const [CommunitiesName, setCommunities] = useState("public");
    const [charsRemaining, setCharsRemaining] = useState(21);
    const [communityType, setCommunityType] = useState("");
    const [error, setError] = useState(""); // indicate to a user if something is wrong
    const [loading, setLoading] = useState(false);
  
    const router = useRouter();
  
    const { toggleMenuOpen } = useDirectory();
    const bg = useColorModeValue("gray.100", "#1A202C");
    const textColor = useColorModeValue("gray.500", "gray.400");
  
    // for the text input
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.value.length > 21) return; 
  
      setCommunities(event.target.value);
      // every time the input change we re-calculate the reaming
      setCharsRemaining(21 - event.target.value.length);
    };
  
    // for the checkbox, we want to select only one
    const onCommunityTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setCommunityType(event.target.name);
    };

    const updateCommunitySnippet = async (userId: string, transaction: any) => {
        if (!userId) return;
                                      // doc(instance,path) path = collection/document/collection/document ....
        const communityUpdateDocRef = doc(firestore,`communities/${CommunitiesName}/userInCommunity/${userId}`);
    
        await transaction.set(communityUpdateDocRef, {
          userId: userId,
          userEmail: user?.email,
        });
      };

    // for creating the community
    const handleCreateCommunity = async () => {
  
      /*
       * We have 2 requirements
       * 1) validate the community name that it is between 3 and 21 characters
       * 2) that the community name is not already taken by someone else
       * 3) that the community name does not contain any special characters
       * 
       * 4) when a user create a community we create the community in the community collection and add that community to the usersCommunity Snippets basically automatically joining that user to the community
       */
  
  
      if (error) setError("");
  
      // Remove all special characters from the community name like !@#$%^&*.,<>/\'";:?
      // https://stackoverflow.com/questions/32311081/check-for-special-characters-in-string
      const format = /[`!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;
  
      if ( format.test(CommunitiesName) || CommunitiesName.length < 3 ) {
        return setError("Community names must be between 3–21 characters, and can only contain letters, numbers, or underscores.");
      }
  
      setLoading(true);
  
      // create the community document in firestore
          // check the name is not taken
          // If Valid name, Create Community
  
      try {

        // create a reference to the document (firestore instance, name, Id ) OR (firestore instance, Path )
        const communityDocRef = doc(firestore, "communities", CommunitiesName);
        
        // this is what create the community
        await runTransaction(firestore, async (transaction) => {
          // this block: create the community in the community collection and add that community to the usersCommunity Snippets basically automatically joining that user to the community

          const communityDoc = await transaction.get(communityDocRef);
          
          // check if the name is already taken
          if (communityDoc.exists()) {
            throw new Error(`Sorry, r/${CommunitiesName} name is taken. Try Another`);
            return;
          }
  
          await transaction.set(communityDocRef, {
            creatorId: user?.uid,
            createdAt: serverTimestamp(),
            numberOfMembers: 1,
            privacyType: communityType, //TODO: typo
          });
  
          // add in the community the user
          updateCommunitySnippet(user?.uid!, transaction);
  
          // add in the user the community
          transaction.set(
            doc( firestore,`users/${user?.uid}/communitySnippets`,CommunitiesName ),
            {
              communityId: CommunitiesName,
              isModerator: true,
              updateTimeStamp: serverTimestamp() as Timestamp,
            }
          );

        });
  
        handleClose();
        toggleMenuOpen(); //??
        setCommunityType("");
        setCommunities("");
        router.push(`r/${CommunitiesName}`);
      } catch (error: any) {
        console.log("Function: HandleCreateCommunity Error: ", error);
        setError(error.message);
      }
  
      setLoading(false);
      //setError("")
      
    };
    

  
    return (
      <>
        <Modal isOpen={open} onClose={handleClose} size="lg">
          <ModalOverlay />
  
          <ModalContent>
            <ModalHeader
              display="flex"
              flexDirection="column"
              fontSize={15}
              padding={3}
            >
              Create a Community!
            </ModalHeader>
  
            <Box pl={3} pr={3}>
              <ModalCloseButton />
              <ModalBody 
                      display="flex" 
                      flexDirection="column" 
                      padding="10px 0px">
  
                <Text fontWeight={600} fontSize={15}>
                  Name:
                </Text>
  
                <Text fontSize={11} color={textColor}>
                  Community Names including capitalization cannot be changed
                </Text>
  
                <Text
                  position="relative"
                  top="28px"
                  left="10px"
                  width="20px"
                  color="gray.400"
                >
                  r/
                </Text>
  
                <Input
                  position="relative"
                  value={CommunitiesName}
                  size="sm"
                  pl="22px"
                  onChange={handleChange}
                />
  
                <Text
                  fontSize="9pt"
                  color={charsRemaining === 0 ? "red" : textColor}
                >
                  {charsRemaining} Characters Remaining
                </Text>
  
                <Text fontSize="9pt" color="red" pt={1}>
                  {error}
                </Text>
  
                <Box mt={4} mb={4}>
                  <Text fontWeight={600} fontSize={15}>
                    Community Type
                  </Text>
  
                  <Stack spacing={2}>
  
                    <Checkbox
                      name="public"
                      isChecked={communityType === "public"}
                      onChange={onCommunityTypeChange}
                    >
                      <Flex align="center">
                        <Icon as={BsFillPersonFill} color={textColor} mr={2} />
                        <Text fontSize="10pt" mr={1}>
                          Public
                        </Text>
                        <Text fontSize="8pt" color={textColor} pt={1}>
                          Anyone can view, post and comment to this community
                        </Text>
                      </Flex>
                    </Checkbox>
  
                    <Checkbox
                      name="restricted"
                      isChecked={communityType === "restricted"}
                      onChange={onCommunityTypeChange}
                    >
                      <Flex align="center">
                        <Icon as={BsFillEyeFill} color={textColor} mr={2} />
                        <Text fontSize="10pt" mr={1}>
                          Restricted
                        </Text>
                        <Text fontSize="8pt" color={textColor} pt={1}>
                          Anyone can view this community, but only approved users
                        </Text>
                      </Flex>
                    </Checkbox>
  
                    <Checkbox
                      name="private"
                      isChecked={communityType === "private"}
                      onChange={onCommunityTypeChange}
                    >
                      <Flex align="center">
                        <Icon as={HiLockClosed} color={textColor} mr={2} />
                        <Text fontSize="10pt" mr={1}>
                          Private
                        </Text>
                        <Text fontSize="8pt" color={textColor} pt={1}>
                          Only approved users can view and submit to this
                          community
                        </Text>
                      </Flex>
                    </Checkbox>
  
                  </Stack>
  
                </Box>
              </ModalBody>
            </Box>
  
            <ModalFooter bg={bg} borderRadius="0px 0px 10px 10px">
  
              <Button
                variant="outline"
                height="30px"
                mr={3}
                onClick={handleClose}
              >
                Cancel
              </Button>
  
              <Button
                height="30px"
                onClick={handleCreateCommunity}
                isLoading={loading}
              >
                Create Community
              </Button>
  
            </ModalFooter>
          </ModalContent>
  
        </Modal>
      </>
    );
  };
  export default CreateCommunityModel;
  