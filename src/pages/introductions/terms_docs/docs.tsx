import { useSearchParams } from "react-router-dom";
import PublicNav from "../../../share/public-nav/public-nav";
import Terms from "./terms/terms";
import Privacy from "./privacy/privacy";
import Disclaimer from "./disclaimer/disclaimer";


export default function Docs() {
    const [searchParams] = useSearchParams();
    const doc = searchParams.get("doc");
    return (
        <div>
            <PublicNav />
            {doc === "terms" && <Terms />}
            {doc === "privacy" && <Privacy />}
            {doc === "disclaimer" && <Disclaimer />}
        </div>
    );
}