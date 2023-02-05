import { extendTheme } from "@chakra-ui/react";
import { Button } from "./button";
import { Input } from "./input";



export const theme = extendTheme({
  colors: {
    brand: {
      100: "#FF3C00",// to be accessed
    },
  },
  fonts: {
    body: "Open Sans, sans-serif",
  },
  styles: {
    global: () => ({
      body: {
        bg: "gray.200", // the whole page
      },
    }),
  },
  components: {
    Button,
    // Input, // not working for some reason - come back to this
  },
});
