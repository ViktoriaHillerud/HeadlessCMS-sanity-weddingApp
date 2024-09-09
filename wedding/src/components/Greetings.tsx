import React, { useEffect, useState } from "react";
import sanityClient from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import "./greetings-album.css";

interface SanityImageSource {
  _type: string;
  asset: {
    _ref: string;
    _type: string;
    url?: string;
  };
}

interface Greeting {
  _id: string;
  fact: string;
  image?: SanityImageSource | null;
  uploader: string;
}

const client = sanityClient({
  projectId: "xjos8i8a",
  dataset: "production",
  useCdn: true,
  apiVersion: "2023-08-21",
  token: import.meta.env.VITE_SANITY_TOKEN,
});

const builder = imageUrlBuilder(client);

function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

const Greetings = () => {
  const [greetings, setGreetings] = useState<Greeting[] | null>(null);
  const [inputText, setInputText] = useState<string>("");
  const [uploaderName, setUploaderName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); 
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchGreetings = async () => {
      setIsLoading(true);
      try {
        const data = await client.fetch(`*[_type == "greeting"] | order(_createdAt desc){
          _id,
          fact,
          image{
            asset->{
              _id,
              url
            }
          },
          uploader 
        }`);

		console.log("Fetched data:", data);

		const filteredData = data.filter((greeting: Greeting) => 
			greeting.fact !== null && greeting.fact.trim() !== ""
		);
        setGreetings(filteredData);
        console.log("Fetched greetings:", filteredData);
      } catch (error) {
        console.error("Fetch greetings failed:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGreetings();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleUploaderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploaderName(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null); 
    if (!inputText.trim()) { 
      setError("Greeting cannot be empty.");
      return;
    }
    setIsLoading(true);

    try {
      let imageAsset = null;

      if (selectedFile) {
        imageAsset = await client.assets.upload("image", selectedFile, {
          contentType: selectedFile.type,
          filename: selectedFile.name,
        });
      }

      const newGreeting = {
        _type: "greeting",
        fact: inputText,
        uploader: uploaderName || "Anonymous",
        image: imageAsset
          ? {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: imageAsset._id,
              },
            }
          : null,
      };

      const result = await client.create(newGreeting);

      const updatedResult = await client.fetch(`*[_id == "${result._id}"]{
        _id,
        fact,
        uploader,
        image{
          asset->{
            _ref,
            _type,
            url
          }
        }
      }`);

      const formattedResult: Greeting = {
        _id: updatedResult[0]._id,
        fact: updatedResult[0].fact,
        uploader: updatedResult[0].uploader,
        image: updatedResult[0].image
          ? {
              _type: updatedResult[0].image._type,
              asset: {
                _ref: updatedResult[0].image.asset._ref,
                _type: updatedResult[0].image.asset._type,
                url: updatedResult[0].image.asset.url,
              },
            }
          : null,
      };

      setGreetings((prevGreetings) =>
        prevGreetings ? [formattedResult, ...prevGreetings] : [formattedResult]
      );

      setInputText("");
      setUploaderName("");
      setSelectedFile(null);
    } catch (error) {
      console.error("Error posting greeting:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openImg = (url: string) => {
    setSelectedImageUrl(url);
  };

  const closeModal = () => {
    setSelectedImageUrl(null);
  };

  return (
    <div>
      <div className="greet-site">
        <h2>Add a Greeting</h2>
        <span className="uploader">
          Add a greeting for us to reminisce our wedding day!
          <br />And if you want, also a picture from the wedding!
        </span>
      </div>

      <form className="form" onSubmit={handleSubmit}>
        <textarea
          onChange={handleChange}
          id="greeting"
          value={inputText}
          placeholder="Enter your greeting here"
        />
        <input
          className="uploader-name"
          type="text"
          placeholder="Your name"
          value={uploaderName}
          onChange={handleUploaderChange}
        />
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button className="btn" type="submit" disabled={isLoading}>
          {isLoading ? "Uploading..." : "Send"}
        </button>
        {error && <p className="error">{error}</p>} 
      </form>

      <section className="greetings">
        <h3>Submitted Greetings:</h3>
        {isLoading && greetings === null ? (
          <p>Loading greetings...</p>
        ) : greetings && greetings.length > 0 ? (
          <article className="greet-collection">
            {greetings.map((item) => (
              <div className="greet-card" key={item._id}>
                {item.fact ? (
                  <p className="the-greeting">"{item.fact}"</p>
                ) : (
                  <p className="the-greeting"></p>
                )}

                <p className="uploader">
                  Uploaded by: {item.uploader || "Anonymous"}
                </p>
                {item.image && item.image.asset && item.image.asset.url && (
                  <img
                    src={urlFor(item.image).width(2000).url()}
                    alt="Greeting"
                    width={350}
                    onClick={() => openImg(urlFor(item.image!).url())}
                  />
                )}
              </div>
            ))}
          </article>
        ) : (
          <p>No greetings found.</p>
        )}
      </section>

      {selectedImageUrl && (
        <div className="modal" onClick={closeModal}>
          <span className="close">&times;</span>
          <img
            className="modal-content"
            src={selectedImageUrl}
            alt="Greeting"
          />
        </div>
      )}
    </div>
  );
};

export default Greetings;
