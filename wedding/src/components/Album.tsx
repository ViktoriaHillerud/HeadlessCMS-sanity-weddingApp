import React, { useEffect, useState } from 'react';
import sanityClient from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import './greetings-album.css';

interface AlbumMedia {
    _id: string;
    image: SanityImageSource | null;
    video: SanityVideoSource | null;
    uploader: string;
}

interface SanityImageSource {
    _type: string;
    asset: {
        _ref: string;
        _type: string;
        url?: string;
    };
}

interface SanityVideoSource {
    _type: string;
    asset: {
        _ref: string;
        _type: string;
        url?: string;
    };
}

const client = sanityClient({
    projectId: 'xjos8i8a',
    dataset: 'production',
    useCdn: true,
    apiVersion: '2023-08-21',
    token: import.meta.env.VITE_SANITY_TOKEN,
});

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource | SanityVideoSource) {
    return builder.image(source);
}

const Album = () => {
    const [media, setMedia] = useState<AlbumMedia[] | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
    const [uploaderName, setUploaderName] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
    const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    useEffect(() => {
        const fetchMedia = async () => {
            try {
                const data = await client.fetch(`*[_type == "greeting" && (defined(image) || defined(video))] | order(_createdAt desc){
                    _id,
                    image{
                        asset->{
                            _ref,
                            _type,
                            url
                        }
                    },
                    video{
                        asset->{
                            _ref,
                            _type,
                            url
                        }
                    },
                    uploader
                }`);

                const shuffledData = data.sort(() => Math.random() - 0.5);
                setMedia(shuffledData);
                console.log('Fetched and shuffled media:', shuffledData);
            } catch (error) {
                console.error('Fetch media failed:', error);
            }
        };
        fetchMedia();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedVideoFile(event.target.files[0]);
        }
    };

    const handleUploaderNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setUploaderName(event.target.value);
    };

    const handleImageSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!selectedFile) {
            setError("Photo cannot be empty.");
            return;
        }

        setIsLoading(true);

        try {
            let imageAsset = null;

            if (selectedFile) {
                imageAsset = await client.assets.upload('image', selectedFile, {
                    contentType: selectedFile.type,
                    filename: selectedFile.name,
                });
            }

            const newImageEntry = {
                _type: 'greeting',
                image: imageAsset ? { _type: 'image', asset: { _type: 'reference', _ref: imageAsset._id } } : null,
                uploader: uploaderName || 'Anonymous',
            };

			const result = await client.create(newImageEntry);
			console.log('Image posted:', result);
			
			const newMedia: AlbumMedia = {
				_id: result._id,
				image: result.image,
				video: null, 
				uploader: result.uploader
			};
			
			setMedia((prevMedia) => (prevMedia ? [newMedia, ...prevMedia] : [newMedia]));
			

            setSelectedFile(null);
            setUploaderName("");
        } catch (error) {
            console.error('Error posting image:', error);
        } finally {
            setIsLoading(false);
        }
    };

	const handleVideoSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
	
		if (!selectedVideoFile) {
			setError("Video cannot be empty.");
			return;
		}
	
		setIsLoading(true);
	
		try {
			let videoAsset = null;
	
			if (selectedVideoFile) {
				videoAsset = await client.assets.upload('file', selectedVideoFile, {
					contentType: selectedVideoFile.type,
					filename: selectedVideoFile.name,
				});
	
				console.log('Uploaded video asset:', videoAsset);
			}
	
			const newVideoEntry = {
				_type: 'greeting',
				video: videoAsset ? { _type: 'file', asset: { _type: 'reference', _ref: videoAsset._id } } : null,
				image: null, 
				uploader: uploaderName || 'Anonymous',
			};
	
			const result = await client.create(newVideoEntry);
			console.log('Video posted:', result);
	
			const newMedia: AlbumMedia = {
				_id: result._id,
				image: null,
				video: result.video,
				uploader: result.uploader
			};
	
			setMedia((prevMedia) => (prevMedia ? [newMedia, ...prevMedia] : [newMedia]));
	
			setSelectedVideoFile(null);
			setUploaderName("");
		} catch (error) {
			console.error('Error posting video:', error);
			setError('There was an issue uploading the video. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};
	
	
	

    const openMedia = (index: number, url: string, type: 'image' | 'video') => {
        setCurrentIndex(index);
        setSelectedMediaUrl(url);
        setSelectedMediaType(type);
    };

    const closeModal = () => {
        setSelectedMediaUrl(null);
        setSelectedMediaType(null);
        setCurrentIndex(null);
    };

    const goToNext = () => {
        if (currentIndex !== null && media) {
            const nextIndex = (currentIndex + 1) % media.length;
            const nextMedia = media[nextIndex];
            setSelectedMediaUrl(nextMedia.image ? urlFor(nextMedia.image).url() : nextMedia.video?.asset.url || null);
            setSelectedMediaType(nextMedia.image ? 'image' : 'video');
            setCurrentIndex(nextIndex);
        }
    };

    const goToPrev = () => {
        if (currentIndex !== null && media) {
            const prevIndex = (currentIndex - 1 + media.length) % media.length;
            const prevMedia = media[prevIndex];
            setSelectedMediaUrl(prevMedia.image ? urlFor(prevMedia.image).url() : prevMedia.video?.asset.url || null);
            setSelectedMediaType(prevMedia.image ? 'image' : 'video');
            setCurrentIndex(prevIndex);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        if (touchStart - touchEnd > 50) {
            goToNext(); 
        }

        if (touchEnd - touchStart > 50) {
            goToPrev(); 
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    return (
        <div>
            <div className='greet-site'>
                <h2>Upload a Photo</h2>
                <span className='uploader'>Add and view photos from the day!</span>
            </div>
            <form className="form" onSubmit={handleImageSubmit}>
                <input
                    className='uploader-name'
                    type="text"
                    placeholder="Your name"
                    value={uploaderName}
                    onChange={handleUploaderNameChange}
                />
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <button className='btn' type="submit" disabled={isLoading}>
                    {isLoading ? 'Uploading...' : 'Upload Photo'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>

            <div className='greet-site' style={{marginTop: "25px"}}>
                <h2>. . . or upload a Video!</h2>
             
            </div>
            <form className="form" onSubmit={handleVideoSubmit}>
                <input
                    className='uploader-name'
                    type="text"
                    placeholder="Your name"
                    value={uploaderName}
                    onChange={handleUploaderNameChange}
                />
                <input type="file" accept="video/*" onChange={handleVideoFileChange} />
                <button className='btn-video' type="submit" disabled={isLoading}>
                    {isLoading ? 'Uploading...' : 'Upload Video'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>

            <section className='greetings'>
                <h3>Media Album</h3>
                {media && media.length > 0 ? (
                    <div className='greet-collection'>
                        {media.map((item, index) => (
                            <div className='greet-card' key={item._id}>
                                {item.image && item.image.asset && (
                                    <img
                                        src={item.image ? urlFor(item.image).width(2000).url() : ""}
                                        alt={item.uploader}
                                        width={350}
                                        onClick={() => item.image && openMedia(index, urlFor(item.image).url(), 'image')}
                                    />
                                )}
                                {item.video && item.video.asset && (
                                    <video
                                        width={350}
                                        controls
                                        src={item.video.asset.url}
                                        onClick={() => openMedia(index, item.video!.asset.url!, 'video')}
                                    />
                                )}
                                <p className='uploader'>Uploaded by: {item.uploader || 'Anonymous'}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No photos or videos found.</p>
                )}
            </section>

            {selectedMediaUrl && (
                <div
                    className='modal'
                    onClick={closeModal}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <span className='close'>&times;</span>
                    <span
                        className='nav prev'
                        onClick={(e) => {
                            e.stopPropagation();
                            goToPrev();
                        }}
                    >
                        &lt;
                    </span>
                    <span
                        className='nav next'
                        onClick={(e) => {
                            e.stopPropagation();
                            goToNext();
                        }}
                    >
                        &gt;
                    </span>
                    {selectedMediaType === 'image' ? (
                        <img className='modal-content' src={selectedMediaUrl} alt="Media" />
                    ) : (
                        <video className='modal-content' src={selectedMediaUrl} controls />
                    )}
                </div>
            )}
        </div>
    );
};

export default Album;
