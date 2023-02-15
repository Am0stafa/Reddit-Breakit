/* eslint-disable react-hooks/exhaustive-deps */
import { Stack } from "@chakra-ui/react";
import { query, collection, where, orderBy, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Community } from "../../atoms/CommunitiesAtom";
import { Post } from "../../atoms/PostAtom";
import { auth, firestore } from "../../firebase/clientApp";
import usePosts from "../../hooks/usePosts";
import PostItem from "./PostItem";
import PostLoader from "./PostLoader";

type PostsProps = {
  communityData: Community;
//   userId?: string;
};

const Posts: React.FC<PostsProps> = ({ communityData }) => {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const { postStateValue, setPostStateValue, onVote, onSelectPost, onDeletePost } = usePosts();

  // fetch the posts right when the page load
  const getPost = async () => {
    try {
      setLoading(true);
      
      // get posts for the community we are currently in
      const postQuery = query(
        collection(firestore, "posts"),
        where("communityId", "==", communityData.id),
        orderBy("createdAt", "desc")
      );
      const postDocs = await getDocs(postQuery);
      // extract the data and save in state object
      const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setPostStateValue((prev) => ({
        ...prev,
        posts: posts as Post[],
      }));

    } catch (error: any) {
      console.log("get post error", error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    getPost();
  }, [communityData]);

  return (
    <>
      {loading ? (
        <PostLoader />
      ) : (
        <Stack>
          {postStateValue.posts.map((item) => (
            <PostItem
              key={item.id}
              post={item}
              userIsCreator={user?.uid === item.creatorId}
              userVoteValue={
                postStateValue.postVotes.find((vote) => vote.postId === item.id)
                  ?.voteValue
              }
              onVote={onVote}
              onSelectPost={onSelectPost}
              onDeletePost={onDeletePost}
            />
          ))}
        </Stack>
      )}
    </>
  );
};
export default Posts;
