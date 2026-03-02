import {useParams} from 'react-router-dom';
import {useEffect, useState} from 'react';
import {Carousel, Collapse, Image, Spin} from 'antd';
import {pageAPI} from '../services';
import {type PageResponse} from '../models';
import {type CarouselParams, type CollapseCarouselItem, parseCarouselParams, parseEmbeds} from '../tools/embedTools';
import DOMPurify from 'dompurify';
import {ActionResult, type SubmitResult, validateParamId} from '@vempain/vempain-auth-frontend';
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

interface EmbedCollapseProps {
    items: CollapseCarouselItem[];
}

function EmbedCollapse({items}: EmbedCollapseProps) {
    return (
        <Collapse
            items={items.map((item, index) => ({
                key: String(index),
                label: item.title,
                children: (
                    <div
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(item.body),
                        }}
                    />
                ),
            }))}
        />
    );
}

interface EmbedCarouselProps {
    items: CollapseCarouselItem[];
    params: CarouselParams;
}

function EmbedCarousel({items, params}: EmbedCarouselProps) {
    return (
        <Carousel
            autoplay={params.autoplay}
            autoplaySpeed={params.dotDuration ? undefined : params.speed}
            speed={params.speed}
            dots={true}
            style={{background: '#1a1a2e', padding: '8px 0'}}
        >
            {items.map((item, index) => (
                <div key={index}>
                    <h3 style={{textAlign: 'center', color: '#E0E0E0', padding: '8px'}}>{item.title}</h3>
                    <div
                        style={{padding: '0 16px'}}
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(item.body),
                        }}
                    />
                </div>
            ))}
        </Carousel>
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
 *   <!--vps:embed:collapse:<url-encoded-json>-->
 *   <!--vps:embed:carousel:<url-encoded-json>:<autoplay>:<dotDuration>:<speed>-->
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
        return <Spin description="Loading page..." spinning={true}>
            <div style={{minHeight: 200}}/>
        </Spin>;
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
                        return <EmbedCollapse key={index} items={descriptor.items}/>;
                    case 'carousel': {
                        const carouselParams = descriptor.extra
                            ? parseCarouselParams(descriptor.extra)
                            : {autoplay: false, dotDuration: false, speed: 500};
                        return <EmbedCarousel key={index} items={descriptor.items} params={carouselParams}/>;
                    }
                    default:
                        return null;
                }
            })}
        </div>
    );
}
