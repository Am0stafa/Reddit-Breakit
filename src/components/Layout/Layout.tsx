import React from 'react';

//? we create types for each component and these types specify the props that the component accepts
// type LayoutProps = {
    
// };
interface Props {
    children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
    
    return(
        <>
            {/* <Navbar /> */}
            <main>
                {children}
            </main>
        </>
    )
}
export default Layout;