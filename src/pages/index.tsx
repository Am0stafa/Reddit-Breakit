/* eslint-disable react-hooks/exhaustive-deps */
import { Stack } from "@chakra-ui/react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { motion } from "framer-motion";
import type { NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

import { Post, PostVote } from "../atoms/PostAtom";
import CreatePostLink from "../components/Community/CreatePostLink";
import PersonalHome from "../components/Community/PersonalHome";
import Premium from "../components/Community/Premium";
import Recommendation from "../components/Community/Recommendation";
import PageContent from "../components/Layout/PageContent";
import PostItem from "../components/posts/PostItem";
import PostLoader from "../components/posts/PostLoader";
import { auth, firestore } from "../firebase/clientApp";
import useCommunityData from "../hooks/useCommunityData";
import usePosts from "../hooks/usePosts";

const Home: NextPage = () => {
  const [user, loadingUser] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const { postStateValue, setPostStateValue, onDeletePost, onSelectPost,onVote } = usePosts();
  const { communityStateValue } = useCommunityData();

  //! fetching the post for a user how is authenticated
  const buildUserHomeFeed = async () => {
    //? we know the communities the user is in so we can build a query to grab a set of posts from the various communities the user is in
    try {
      if (communityStateValue.mySnippets.length) { // check if the user joined any communities
        //? create an array of all of the communityId and query all the posts where the post document has the same communityId
        const myCommunityIds = communityStateValue.mySnippets.map(
          (snippet) => snippet.communityId
        );

        const postQuery = query(
          collection(firestore, "posts"),
          where("communityId", "in", myCommunityIds),
          limit(10)
        );

        const postDoc = await getDocs(postQuery);
        const posts = postDoc.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPostStateValue((prev) => ({
          ...prev,
          posts: posts as Post[],
        }));
      } else {
        buildUserHomeFeed(); //! recursive to keep on checking if the user joined any communities
        // if (communityStateValue.mySnippets.length) buildUserHomeFeed(); IN a useEffect
        // this wont work because what if the user didnt join any communities and the mySnippets wont exists so it will return false and the user will never be able to see this page
        //another solution is to make a parameter to the community state that is going to change once our application has tried to fetch the snippets from the database 
      }
    } catch (error) {
      console.log("Building HHome Error: ", error);
    }
  };
  
  //! fetching the post for a user how is NOT authenticated
  const buildNoUserHomeFeed = async () => {
    setLoading(true);
    try {
      //? get the most populate posts in the database
      //! query the post collection
      const postQuery = query(collection(firestore, "posts"), orderBy("voteStatus", "desc"),
        //limit(10)
      );

      const postDocs = await getDocs(postQuery);
      const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setPostStateValue((prev) => ({
        ...prev,
        posts: posts as Post[],
      }));

    } catch (error) {
      console.log("BuildNoUserHome: ", error);
    }
    setLoading(false);
  };

  //! this is only going to get called for authenticated users to populate the postVotes in post atom
  const getUserPostVotes = async () => {
    try {
      const postIds = postStateValue.posts.map((post) => post.id);

      const batches: PostVote[] | any[][] = [];

      while (postIds.length) {
        const batch = postIds.splice(0, 10);

        const postVotesQuery = query(
          collection(firestore, `users/${user?.uid}/postVotes`),
          where("postId", "in", [...batch])
        );
        const postVoteDoc = await getDocs(postVotesQuery);

        const postVotes = postVoteDoc.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        }));

        batches.push(postVotes as any);
      }

      setPostStateValue((prev) => ({
        ...prev,
        postVotes: batches.flat() as PostVote[],
      }));
    } catch (error) {
      console.log("getUserPostVotes Error", error);
    }
  };

  useEffect(() => {
    if (communityStateValue.snippetsFetched) buildNoUserHomeFeed();
  }, [communityStateValue.snippetsFetched]);


  useEffect(() => {
    //! if the user logged in or not and if the auth service has attempted to try to get the authenticated user
    if (!user && !loadingUser) buildNoUserHomeFeed();
  }, [user, loadingUser]);


  useEffect(() => {
    //! explained in the end of this function
    if (user && postStateValue.posts.length) getUserPostVotes();

    //? clean up function that will be called when this component unmount to clean up so that we dont get an over lap
    // run when we move away from this component
    return () => {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }));
    };
  }, [user, postStateValue.posts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      <Head>
        <title>Breakit</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/images/header.png" />
      </Head>
      
      <PageContent>
        <>
          <CreatePostLink />
          {loading ? (
            <PostLoader />
          ) : (
            <Stack>
              {postStateValue.posts.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onVote={onVote}
                  onDeletePost={onDeletePost}
                  userVoteValue={
                    postStateValue.postVotes.find(
                      (item) => item.postId === post.id
                    )?.voteValue
                  }
                  userIsCreator={user?.uid === post.creatorId}
                  onSelectPost={onSelectPost}
                  homePage
                />
              ))}
            </Stack>
          )}
        </>
        <Stack spacing={5}>
          <Recommendation />
          <Premium />
          <PersonalHome />
        </Stack>
      </PageContent>
    </motion.div>
  );
};

export default Home;
