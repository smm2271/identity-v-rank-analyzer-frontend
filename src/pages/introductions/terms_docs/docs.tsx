import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import PublicNav from "../../../share/public-nav/public-nav";
import styles from "./docs.module.css";
import termsMd from "./terms/terms.md?raw";
import privacyMd from "./privacy/privacy.md?raw";
import disclaimerMd from "./disclaimer/disclaimer.md?raw";

type DocKey = "terms" | "privacy" | "disclaimer";

const DOCS: Record<DocKey, { label: string; markdown: string }> = {
    terms: { label: "服務條款", markdown: termsMd },
    privacy: { label: "隱私政策", markdown: privacyMd },
    disclaimer: { label: "法律免責聲明", markdown: disclaimerMd },
};

export default function Docs() {
    const [searchParams] = useSearchParams();
    const docParam = searchParams.get("doc");
    const currentDoc: DocKey = useMemo(() => {
        if (!docParam) return "terms";
        return (Object.prototype.hasOwnProperty.call(DOCS, docParam) ? docParam : "terms") as DocKey;
    }, [docParam]);
    const { markdown } = DOCS[currentDoc];
    const contentRef = useRef<HTMLDivElement | null>(null);
    const [toc, setToc] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        const frame = requestAnimationFrame(() => {
            if (!contentRef.current) return;
            const headings = Array.from(contentRef.current.querySelectorAll("h2[id]"));
            setToc(
                headings.map((heading) => ({
                    id: heading.id,
                    title: heading.textContent ?? heading.id,
                }))
            );
        });

        return () => cancelAnimationFrame(frame);
    }, [currentDoc, markdown]);

    return (
        <>
            <PublicNav />
            <div className={styles.outlayContainer}>
                <div className={styles.switch}>
                    {(Object.keys(DOCS) as DocKey[]).map((key) => (
                        <div key={key} className={styles.docItem}>
                            <NavLink to={`?doc=${key}`} className={currentDoc === key ? styles.activeLink : styles.link}>
                                {DOCS[key].label}
                            </NavLink>
                            {currentDoc === key && toc.length > 0 && (
                                <div className={styles.subSwitch}>
                                    {toc.map((subItem) => (
                                        <a key={subItem.id} href={`#${subItem.id}`}>
                                            {subItem.title}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                <div ref={contentRef} className={styles.contentContainer}>
                    <div className={styles.container}>
                        <ReactMarkdown
                            className={styles.markdown}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSlug]}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </>
    );
}