/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { authModelState } from "../atoms/authModalAtom";
import { CommunityState } from "../atoms/CommunitiesAtom";
import { Post, postState, PostVote } from "../atoms/PostAtom";
import { auth, firestore, storage } from "../firebase/clientApp";

const usePosts = () => {
  const [postStateValue, setPostStateValue] = useRecoilState(postState);
  const [user] = useAuthState(auth);
  const router = useRouter();
  const setAuthModalState = useSetRecoilState(authModelState);
  const currentCommunity = useRecoilValue(CommunityState).currentCommunity;

  /*
   * post: that the user  the user is trying to vote on
   * number: which is the value of the vote
   * communityId: in which this post is in
   */
  const onVote = async (event:React.MouseEvent<Element, MouseEvent>,post: Post,vote: number,communityId: string)=> {
    //! this prevent the event from traveling upward to the parent which also has onClick function
    event.stopPropagation();

    // protect against unauthenticated user
    if (!user?.uid) {
      setAuthModalState({ open: true, view: "login" });
      return;
    }

    try {
      //? get the post status for the post we are voting on, post passed as an argument
      const { voteStatus } = post;
      //? did the user voted on this post?
      const exitingVote = postStateValue.postVotes.find((vote) => vote.postId === post.id);

      const batch = writeBatch(firestore);
      //? copy of the post argument,state,value to mutate it
      const updatedPost = { ...post };
      const updatedPosts = [...postStateValue.posts];
      let updatedPostVotes = [...postStateValue.postVotes];
      let voteChange = vote;

      //! if it is an existing vote: add or subtract 1 from the postVotes subCollection
      //! else: are they removing vote or flipping ?
      if (!exitingVote) {
        // create a new postVote Document

        // document reference on what we are creating on the database
        const postVoteRef = doc(collection(firestore, "users", `${user?.uid}/postVotes`));

        const newVote: PostVote = {
          id: postVoteRef.id,
          postId: post.id!,
          communityId,
          voteValue: vote,
        };

        // create the new subCollection
        batch.set(postVoteRef, newVote);
        // add the vote value
        updatedPost.voteStatus = voteStatus + vote;
        // add the vote to the user
        updatedPostVotes = [...updatedPostVotes, newVote];
      } 
      else {
        //removing vote => up to neutral OR down to neutral
        //flipping vote => up to down OR down to up

        const postVoteRef = doc(firestore,"users",`${user?.uid}/postVotes/${exitingVote.id}`);

        //! user is removing there vote if the vote send matches the value of the already existing vote (double click)
        if (exitingVote.voteValue === vote) {
          voteChange *= -1; 
          // subtract to go in the negative direction
          updatedPost.voteStatus = voteStatus - vote;
          // remove the existing vote from post state
          updatedPostVotes = updatedPostVotes.filter((vote) => vote.id !== exitingVote.id);

          // remove the subCollection
          batch.delete(postVoteRef);
        } 
        //! user flipping there vote
        else {
          voteChange = 2 * vote;
          updatedPost.voteStatus = voteStatus + 2 * vote;

          const voteIdx = postStateValue.postVotes.findIndex((vote) => vote.id === exitingVote.id);

          if (voteIdx !== -1) {
            // the object at that index
            updatedPostVotes[voteIdx] = {
              ...exitingVote,
              voteValue: vote,
            };
          }
          batch.update(postVoteRef, {
            voteValue: vote,
          });
        }
      }
      //! finally update the post document

      const postIdx = postStateValue.posts.findIndex((item) => item.id === post.id);

      updatedPosts[postIdx] = updatedPost;

      setPostStateValue((prev) => ({
        ...prev,
        posts: updatedPosts,
        postVotes: updatedPostVotes,
      }));

      if (postStateValue.selectedPost) {
        setPostStateValue((prev) => ({
          ...prev,
          selectedPost: updatedPost,
        }));
      }

      const postRef = doc(firestore, "posts", post.id!);
      batch.update(postRef, { voteStatus: voteStatus + voteChange });

      await batch.commit();
    } catch (error) {
      console.log("onVote Error", error);
    }
  };

  //! when we select a post save it in our state and then take this post and put it on the post state value
  const onSelectPost = (post: Post) => {
    setPostStateValue((prev) => ({
      ...prev,
      selectedPost: post,
    }));
    router.push(`/r/${post.communityId}/comments/${post.id}`);
  };

  const onDeletePost = async (post: Post): Promise<boolean> => {
    try {
      /*
       * 1) check if this post has an image and if so delete from the bucket
       * 2) then delete the post document and update the atom to reflect on the ui
       */

      // check if image delete if exists
      if (post.imageURL) {
        const imageRef = ref(storage, `posts/${post.id}/image`);
        await deleteObject(imageRef);
      }
      //! after a value tells typescript that its safe to proceed

      // delete post document from firestore
      const postDocRef = doc(firestore, "posts", post.id!);
      await deleteDoc(postDocRef);

      setPostStateValue((prev) => ({
        ...prev,
        posts: prev.posts.filter((item) => item.id !== post.id),
      }));

      return true;
    } catch (error) {
      return false;
    }
  };

  //! fetch all of the users post votes for the current community they are currently in
  const getCommunityPostVotes = async (communityId: string) => {
    const postVotesQuarry = query(
      collection(firestore, "users", `${user?.uid}/postVotes`),
      where("communityId", "==", communityId)
    );

    const postVoteDocs = await getDocs(postVotesQuarry);
    const postVotes = postVoteDocs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setPostStateValue((prev) => ({
      ...prev,
      postVotes: postVotes as PostVote[],
    }));
  };

  //! call to fill global state
  useEffect(() => {
    //no user or community
    if (!user || !currentCommunity?.id) return;

    getCommunityPostVotes(currentCommunity?.id);
  }, [!user, currentCommunity]);

  //! clear the state when the user logout
  useEffect(() => {
    if (!user) {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
    }
  }, [user]);

  return {
    postStateValue,
    setPostStateValue,
    onVote,
    onSelectPost,
    onDeletePost,
  };
};

export default usePosts;
