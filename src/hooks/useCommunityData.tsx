/* eslint-disable react-hooks/exhaustive-deps */
//! join/leave community and saving. state and logic repeated
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useSetRecoilState } from "recoil";
import { authModelState } from "../atoms/authModalAtom";
import {
  Community,
  CommunitySnippet,
  CommunityState,
} from "../atoms/CommunitiesAtom";
import { auth, firestore } from "../firebase/clientApp";

const useCommunityData = () => {
    const [user] = useAuthState(auth);

    const router = useRouter();

    const setAuthModelState = useSetRecoilState(authModelState);
    const [communityStateValue, setCommunityStateValue] = useRecoilState(CommunityState);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    //! function to design which to call
    const onJoinOrCommunity = (communityData: Community, isJoined: boolean) => {
        if (!user) {
            setAuthModelState({ open: true, view: "login" });
            return;
        }

        if (isJoined) {
            leaveCommunity(communityData.id);
            return;
        }
        joinCommunity(communityData);
    };

    //! fetch the communitySnippets for the current user and store them inside of setCommunityStateValue atom
    const getMySnippets = async () => {
        setLoading(true);
        try {
            //? grab all the documents inside of this community snippet collection for this current user: returning and array of documents
            const snippetDocs = await getDocs( collection(firestore, `users/${user?.uid}/communitySnippets`) );
            //? we will take does documents and extract the data from each one and store it inside the atom
            const snippets = snippetDocs.docs.map((doc) => ({ ...doc.data() }));

            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: snippets as CommunitySnippet[],
                snippetsFetched: true,
            }));

        } catch (error: any) {
            console.log("Get My Snippet Error: ", error);
            setError(error.message);
        }

        setLoading(false);
    };
    
    // on every load either clear the state or fill the state
    useEffect(() => {
        if (!user) {
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: [],
                snippetsFetched: false,
            }));
            return;
        }
        
        getMySnippets();
    }, [user]);

    const getCommunityData = async (communityId: string) => {
    try {
        const communityDocRef = doc(firestore, "communities", communityId);
        const communityDoc = await getDoc(communityDocRef);

        setCommunityStateValue((prev) => ({
        ...prev,
        currentCommunity: {
            id: communityDoc.id,
            ...communityDoc.data(),
        } as Community,
        }));
    } catch (error) {
        console.log(error);
    }
    };


    useEffect(() => {
        const { communityId } = router.query;

        if (communityId && !communityStateValue.currentCommunity) {
            getCommunityData(communityId as string);
        }
    }, [router.query, communityStateValue.currentCommunity]);


    const joinCommunity = async (communityData: Community) => {
        //? there are two database updates that we need to make that we are going to group together into a batch
        //* 1) creating a new communitySnippets for the user, by taking this community and create a snippet then add it to the user communitySnippets
        //* 2) updating the number of members on this community
        //? After a successfully batch we need to update our recoil state (communityStateValue.mySnippets) to reflect the update
        
        try {
            // create a batch object
            const batch = writeBatch(firestore);

            // create the snippet
            const newSnippet: CommunitySnippet = {
                communityId: communityData.id,
                imageURL: communityData.imageURL || "",
                isModerator: user?.uid === communityData.creatorId,
                updateTimeStamp: serverTimestamp() as Timestamp,
            };
            /*
                The doc function might be a shorthand for this process, allowing you to create a reference to a Firestore document with a simpler and more concise syntax.
                set: takes the reference and data
            */

                                    //path to the collection
            batch.set(doc(firestore, `users/${user?.uid}/communitySnippets`, communityData.id), newSnippet);

            batch.update(doc(firestore, "communities", communityData.id), { numberOfMembers: increment(1) });
            
            // commit the chances
            await batch.commit();

            // update the atom
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: [...prev.mySnippets, newSnippet],
            }));

            updateCommunitySnippet(communityData, user?.uid!);
        } catch (error: any) {
            console.log("JoinCommunity Error: ", error);
            setError(error.message);
        }
        setLoading(false);
    };

    const updateCommunitySnippet = async ( communityData: Community, userId: string) => {
        if (!communityData && !userId) return;

        try {
            const batch = writeBatch(firestore);

            const newSnippet = {
            userId: userId,
            userEmail: user?.email,
            };

            batch.set(
            doc(
                firestore,
                `communities/${communityData.id}/userInCommunity/${userId}`
            ),
            newSnippet
            );

            await batch.commit();
        } catch (error: any) {
            console.log("JoinCommunity Error", error);
            setError(error.message);
        }
    };

    const leaveCommunity = async (communityId: string) => {
        // the exact opposite of join
        //! batch write
            //* delete the community snippet from the user
            //* update the number of members

        try {
            const batch = writeBatch(firestore);

            batch.delete(doc(firestore, `users/${user?.uid}/communitySnippets`, communityId));

            // no decrement function
            batch.update(doc(firestore, "communities", communityId), { numberOfMembers: increment(-1) });

            await batch.commit();

            // update the atom
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: prev.mySnippets.filter( (item) => item.communityId !== communityId ),
            }));
        } catch (error: any) {
            console.log("JoinCommunity Error", error);
            setError(error.message);
        }
        setLoading(false);
    };

    // data and functions
    return {
        communityStateValue,
        onJoinOrCommunity,
        loading,
    };

};
export default useCommunityData;
