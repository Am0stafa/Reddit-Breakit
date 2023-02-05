import { ChakraProvider } from '@chakra-ui/react'
import type { AppProps } from 'next/app'
import { theme } from '../chakra/theme'

export default function App({ Component, pageProps }: AppProps) {
    return (
        <ChakraProvider theme={theme}>
          <Component {...pageProps} />
        </ChakraProvider>
    )
}

