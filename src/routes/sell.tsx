import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Camera, CheckCircle2, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopProgressBar } from "@/components/top-progress-bar";
import { categories, conditions, type Category, type Condition } from "@/data-campus-trade";
import { createMarketplaceItem, uploadMarketplacePhoto } from "@/lib/marketplace";

export const Route = createFileRoute("/sell")({
  head: () => ({
    meta: [
      { title: "List an Item — CampusTrade" },
      {
        name: "description",
        content: "Create a CampusTrade listing with photo, category, price, dorm, condition, and WhatsApp contact.",
      },
      { property: "og:title", content: "List an Item — CampusTrade" },
      { property: "og:description", content: "Sell campus essentials to verified nearby students." },
    ],
  }),
  component: SellPage,
});

function SellPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<Category>("Textbooks");
  const [condition, setCondition] = useState<Condition>("Good");
  const [dorm, setDorm] = useState("");
  const [seller, setSeller] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitted(false);
    setIsSubmitting(true);

    try {
      const uploadedImageUrl = photoFile ? await uploadMarketplacePhoto(photoFile) : null;

      await createMarketplaceItem({
        title: title.trim(),
        price: Number(price),
        category,
        condition,
        dorm: dorm.trim(),
        seller: seller.trim(),
        phone: phone.replace(/[^0-9]/g, ""),
        description: description.trim(),
        image_url: uploadedImageUrl,
        status: "published",
        user_id: null,
      });

      setSubmitted(true);
      setTitle("");
      setPrice("");
      setDorm("");
      setSeller("");
      setPhone("");
      setDescription("");
      setImageUrl("");
      setPhotoFile(null);
    } catch {
      setError("Couldn’t publish this listing. Please check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Please keep the photo under 1 MB.");
      return;
    }

    setError("");
    setPhotoFile(file);
    setImageUrl(URL.createObjectURL(file));
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopProgressBar active={isSubmitting} />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft /> Marketplace
            </Link>
          </Button>
          <Badge variant="trust" className="gap-1.5">
            <ShieldCheck className="size-3.5" /> Verified Student
          </Badge>
        </header>

        <section className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-secondary">Seller Dashboard</p>
            <h1 className="text-4xl font-bold tracking-tight">List an item in minutes.</h1>
            <p className="Sample Message">
              Add a small product photo, set a fair price, and let buyers message you directly on WhatsApp.
            </p>
            <div className="campus-card rounded-3xl border border-border bg-card p-5">
              <div className="Sample Message">
                {imageUrl ? (
                  <img src={imageUrl} alt="Listing preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="space-y-2 px-6">
                    <Camera className="mx-auto size-9 text-secondary" />
                    <p className="font-medium">Photo preview</p>
                    <p className="Sample Message">Upload a JPG, PNG, or WebP under 1 MB.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="campus-card rounded-3xl border border-border bg-card p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Item title</span>
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. Organic Chemistry Textbook"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Price</span>
                <input
                  required
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0 for free"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                />
                <p className="Sample Message">Enter price in INR. Use 0 if you want to give it away free.</p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Hostel / Dorm</span>
                <input
                  required
                  value={dorm}
                  onChange={(event) => setDorm(event.target.value)}
                  placeholder="Maple Hall"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Seller name</span>
                <input
                  required
                  value={seller}
                  onChange={(event) => setSeller(event.target.value)}
                  placeholder="Aditi R."
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Condition</span>
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value as Condition)}
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                >
                  {conditions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">WhatsApp number</span>
                <input
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  placeholder="Include country code"
                  className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Description</span>
                <textarea
                  required
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Share condition notes, pickup timing, or what’s included."
                  className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus:ring-2"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium">Photo upload</span>
                <div className="Sample Message">
                  <UploadCloud className="size-5 shrink-0 text-secondary" />
                  <input
                    onChange={handlePhotoChange}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-secondary-foreground"
                  />
                </div>
                <p className="Sample Message">Maximum 1 MB.</p>
              </label>
            </div>

            <Button type="submit" variant="energetic" className="mt-6 h-12 w-full rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              {isSubmitting ? "Publishing..." : "Publish Listing"}
            </Button>

            {error && <p className="mt-4 text-sm font-medium text-destructive">{error}</p>}

            {submitted && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-sm">
                <CheckCircle2 className="mt-0.5 size-5 text-success" />
                <div>
                  <p className="font-semibold">Listing published</p>
                  <p className="Sample Message">It will appear in the marketplace feed automatically.</p>
                </div>
              </div>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}
