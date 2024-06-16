import { appWithTranslation } from "next-i18next";
import "../app/globals.css";

const MyApp = ({ Component, pageProps }: any) => <Component {...pageProps} />;

export default appWithTranslation(MyApp);
