import React from "react";
import { Flex, Button } from "@chakra-ui/react";
import Link from "next/link";
import Head from "next/head";

const NotFound: React.FC = () => {
    return (
    <div>
        <Head>
        <title>Not Found</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/images/not-found-512.webp" />
        </Head>

        <Flex
        direction="column"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
        >
        Sorry, that community does not exist or has been banned!
        <Link href="/">
            <Button mt={4}>GO HOME</Button>
        </Link>
        </Flex>
    </div>
    );
};
export default NotFound;
