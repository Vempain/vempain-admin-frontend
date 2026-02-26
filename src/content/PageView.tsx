import {useParams} from 'react-router-dom';
import React, {useEffect, useState} from 'react';
import {Carousel, Collapse, Image, Spin} from 'antd';
import {pageAPI} from '../services';
import {type PageResponse} from '../models';
import {parseEmbeds, type CarouselParams, parseCarouselParams} from '../tools/embedTools';
import DOMPurify from 'dompurify';
import {validateParamId, ActionResult, type SubmitResult} from '@vempain/vempain-auth-frontend';
import {SubmitResultHandler} from '../main';

const FILE_BASE_URL = import.meta.env.VITE_APP_FILE_URL ?? '';

function fileUrl(id: number): string {
    return `${FILE_BASE_URL}/files/${id}`;
}

interface EmbedImageProps {
    id: number;
}

function EmbedImage({id}: EmbedImageProps) {
    return (
        <div style={{margin: '8px 0'}}>
            <Image
                src={fileUrl(id)}
                style={{maxWidth: '100%', height: 'auto'}}
                alt={`Embedded image ${id}`}
            />
        </div>
    );
}

interface EmbedHeroProps {
    id: number;
    pageTitle: string;
}

function EmbedHero({id, pageTitle}: EmbedHeroProps) {
    return (
        <div style={{position: 'relative', width: '100%', margin: '8px 0'}}>
            <Image
                src={fileUrl(id)}
                preview={false}
                style={{width: '100%', height: 'auto', display: 'block'}}
                alt={`Hero image ${id}`}
            />
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <h1 style={{color: '#fff', margin: 0, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.8)'}}>{pageTitle}</h1>
            </div>
        </div>
    );
}

interface ChildPagesEmbedProps {
    parentId: number;
    renderChildren: (children: PageResponse[]) => React.ReactNode;
}

function ChildPagesEmbed({parentId, renderChildren}: ChildPagesEmbedProps) {
    const [children, setChildren] = useState<PageResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        pageAPI.findByParentId(parentId)
            .then((pages) => {
                const sorted = [...pages].sort((a, b) => {
                    // Pages without a published date are placed last
                    const aTime = a.published ? new Date(a.published).getTime() : Number.MAX_SAFE_INTEGER;
                    const bTime = b.published ? new Date(b.published).getTime() : Number.MAX_SAFE_INTEGER;
                    return aTime - bTime;
                });
                setChildren(sorted);
            })
            .catch((err) => {
                console.error('Failed to load child pages:', err);
            })
            .finally(() => setLoading(false));
    }, [parentId]);

    if (loading) return <Spin size="small"/>;
    return <>{renderChildren(children)}</>;
}

interface EmbedCollapseProps {
    parentId: number;
}

function EmbedCollapse({parentId}: EmbedCollapseProps) {
    return (
        <ChildPagesEmbed
            parentId={parentId}
            renderChildren={(children) => (
                <Collapse
                    items={children.map((child) => ({
                        key: String(child.id),
                        label: child.title,
                        children: (
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(child.body ?? ''),
                                }}
                            />
                        ),
                    }))}
                />
            )}
        />
    );
}

interface EmbedCarouselProps {
    parentId: number;
    params: CarouselParams;
}

function EmbedCarousel({parentId, params}: EmbedCarouselProps) {
    return (
        <ChildPagesEmbed
            parentId={parentId}
            renderChildren={(children) => (
                <Carousel
                    autoplay={params.autoplay}
                    autoplaySpeed={params.dotDuration ? undefined : params.speed}
                    speed={params.speed}
                    dots={true}
                    style={{background: '#1a1a2e', padding: '8px 0'}}
                >
                    {children.map((child) => (
                        <div key={child.id}>
                            <h3 style={{textAlign: 'center', color: '#E0E0E0', padding: '8px'}}>{child.title}</h3>
                            <div
                                style={{padding: '0 16px'}}
                                dangerouslySetInnerHTML={{
                                    __html: DOMPurify.sanitize(child.body ?? ''),
                                }}
                            />
                        </div>
                    ))}
                </Carousel>
            )}
        />
    );
}

/**
 * PageView – renders a page by its ID, replacing VPS embed tags with
 * the appropriate Ant Design components.
 *
 * Supported embed tags:
 *   <!--vps:embed:gallery:%d-->
 *   <!--vps:embed:image:%d-->
 *   <!--vps:embed:hero:%d-->
 *   <!--vps:embed:collapse:%d-->
 *   <!--vps:embed:carousel:%d:<autoplay>:<dotDuration>:<speed>-->
 */
export function PageView() {
    const {paramId} = useParams<{paramId: string}>();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState<PageResponse | null>(null);
    const [loadResults, setLoadResults] = useState<SubmitResult>({status: ActionResult.NO_CHANGE, message: ''});

    useEffect(() => {
        const id = validateParamId(paramId);
        if (id <= 0) {
            setLoadResults({status: ActionResult.FAIL, message: 'Invalid page ID'});
            setLoading(false);
            return;
        }
        pageAPI.findById(id, null)
            .then((p) => setPage(p))
            .catch(() => setLoadResults({status: ActionResult.FAIL, message: 'Failed to load page'}))
            .finally(() => setLoading(false));
    }, [paramId]);

    if (loadResults.status !== ActionResult.NO_CHANGE) {
        return <SubmitResultHandler submitResult={loadResults} successTo="/pages" failTo="/pages"/>;
    }

    if (loading) {
        return <Spin tip="Loading page..." spinning={true}><div style={{minHeight: 200}}/></Spin>;
    }

    if (!page) return null;

    const segments = parseEmbeds(page.body ?? '');

    return (
        <div className="DarkDiv">
            <h1>{page.title}</h1>
            {segments.map((segment, index) => {
                if (segment.kind === 'html') {
                    return (
                        <div
                            key={index}
                            dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(segment.content)}}
                        />
                    );
                }

                const {descriptor} = segment;
                switch (descriptor.type) {
                    case 'gallery':
                        // Gallery rendering is handled by the site frontend; in admin preview
                        // we just show a placeholder label.
                        return (
                            <div
                                key={index}
                                style={{
                                    padding: '16px',
                                    background: '#1a1a2e',
                                    border: '1px dashed #4a90d9',
                                    borderRadius: 4,
                                    color: '#90c4f8',
                                    margin: '8px 0',
                                }}
                            >
                                🖼 Gallery #{descriptor.id}
                            </div>
                        );
                    case 'image':
                        return <EmbedImage key={index} id={descriptor.id}/>;
                    case 'hero':
                        return <EmbedHero key={index} id={descriptor.id} pageTitle={page.title}/>;
                    case 'collapse':
                        return <EmbedCollapse key={index} parentId={descriptor.id}/>;
                    case 'carousel': {
                        const carouselParams = descriptor.extra
                            ? parseCarouselParams(descriptor.extra)
                            : {autoplay: false, dotDuration: false, speed: 500};
                        return <EmbedCarousel key={index} parentId={descriptor.id} params={carouselParams}/>;
                    }
                    default:
                        return null;
                }
            })}
        </div>
    );
}
