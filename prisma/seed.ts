import { PrismaClient, PostStatus, DifficultyLevel, CommentStatus, SubscriberStatus, Role } from "@prisma/client";

const prisma = new PrismaClient();

function heading(text: string) {
  return { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text }] };
}
function paragraph(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function buildDoc(title: string) {
  return {
    type: "doc",
    content: [
      paragraph(
        `In this article we take a close look at ${title.toLowerCase()}, breaking down what actually matters, backed by real examples and a healthy dose of skepticism toward hype.`,
      ),
      heading("Why this matters"),
      paragraph(
        "Most teams get the fundamentals wrong before they ever touch the interesting parts of the problem. We start there.",
      ),
      {
        type: "callout",
        attrs: { type: "tip" },
        content: [paragraph("Skim the Key Takeaways section at the bottom if you're short on time.")],
      },
      heading("A closer look"),
      paragraph(
        "There is no silver bullet here — just a set of tradeoffs that change depending on your team size, traffic, and risk tolerance.",
      ),
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [paragraph("Start simple, measure, then optimize.")] },
          { type: "listItem", content: [paragraph("Write down the assumption you're testing.")] },
          { type: "listItem", content: [paragraph("Automate the boring parts first.")] },
        ],
      },
      heading("Conclusion"),
      paragraph("None of this is groundbreaking — but doing the basics consistently well usually wins."),
    ],
  };
}

function html(title: string) {
  return `<p>In this article we take a close look at ${title.toLowerCase()}, breaking down what actually matters, backed by real examples and a healthy dose of skepticism toward hype.</p><h2 id="why-this-matters">Why this matters</h2><p>Most teams get the fundamentals wrong before they ever touch the interesting parts of the problem. We start there.</p><div class="callout" data-type="tip"><p>Skim the Key Takeaways section at the bottom if you're short on time.</p></div><h2 id="a-closer-look">A closer look</h2><p>There is no silver bullet here — just a set of tradeoffs that change depending on your team size, traffic, and risk tolerance.</p><ul><li>Start simple, measure, then optimize.</li><li>Write down the assumption you're testing.</li><li>Automate the boring parts first.</li></ul><h2 id="conclusion">Conclusion</h2><p>None of this is groundbreaking — but doing the basics consistently well usually wins.</p>`;
}

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80",
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
  "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80",
  "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1200&q=80",
  "https://images.unsplash.com/photo-1550439062-609e1531270e?w=1200&q=80",
];

async function main() {
  console.log("Seeding database...");

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      siteName: "The Publication",
      siteDescription: "In-depth articles, tutorials, and guides — written by experts, structured for humans and AI alike.",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      organizationName: "The Publication Inc.",
      contactEmail: "hello@example.com",
    },
    update: {},
  });

  const adminUser = await prisma.user.upsert({
    where: { clerkId: "seed_admin" },
    create: { clerkId: "seed_admin", email: "admin@example.com", name: "Admin User", role: Role.ADMIN },
    update: {},
  });

  const authorsData = [
    { name: "Sarah Kim", title: "Senior Editor", bio: "Sarah writes about distributed systems and developer experience. Previously at three infra startups.", verified: true },
    { name: "James Okafor", title: "Staff Writer", bio: "James covers frontend architecture, performance, and design systems.", verified: true },
    { name: "Priya Nair", title: "Contributing Author", bio: "Priya is a security engineer who writes about pragmatic AppSec.", verified: false },
  ];

  const authors = [];
  for (const a of authorsData) {
    const author = await prisma.author.upsert({
      where: { slug: a.name.toLowerCase().replace(/\s+/g, "-") },
      create: {
        userId: a.name === "Sarah Kim" ? adminUser.id : undefined,
        name: a.name,
        slug: a.name.toLowerCase().replace(/\s+/g, "-"),
        title: a.title,
        bio: a.bio,
        avatarUrl: `https://i.pravatar.cc/150?u=${encodeURIComponent(a.name)}`,
        isVerified: a.verified,
        featured: a.verified,
        websiteUrl: "https://example.com",
        twitterUrl: "https://twitter.com/example",
      },
      update: {},
    });
    authors.push(author);
  }

  const categoriesData = [
    { name: "Engineering", slug: "engineering", color: "#6366f1" },
    { name: "AI & Machine Learning", slug: "ai-machine-learning", color: "#8b5cf6" },
    { name: "Product", slug: "product", color: "#06b6d4" },
    { name: "Design", slug: "design", color: "#ec4899" },
    { name: "Security", slug: "security", color: "#ef4444" },
    { name: "Career", slug: "career", color: "#f59e0b" },
  ];

  const categories = [];
  for (const c of categoriesData) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      create: { name: c.name, slug: c.slug, color: c.color, description: `Everything about ${c.name.toLowerCase()}.` },
      update: {},
    });
    categories.push(category);
  }

  const tagsData = ["nextjs", "typescript", "postgresql", "react", "performance", "seo", "career-growth", "llm", "architecture", "testing"];
  const tags = [];
  for (const t of tagsData) {
    const tag = await prisma.tag.upsert({
      where: { slug: t },
      create: { name: t.replace("-", " "), slug: t },
      update: {},
    });
    tags.push(tag);
  }

  const titles = [
    "The Complete Guide to Server Components in 2026",
    "How We Cut Our Database Costs by 70%",
    "Designing APIs That Don't Make You Hate Your Life",
    "A Practical Introduction to Vector Search",
    "Why Your Onboarding Flow Is Losing Users",
    "Building a Design System From Scratch",
    "The Hidden Cost of Premature Microservices",
    "Prompt Engineering Patterns That Actually Work",
    "Zero-Downtime Postgres Migrations, Step by Step",
    "What Senior Engineers Do Differently",
    "A Security Checklist for Every Production Launch",
    "Rethinking Caching in the Age of Edge Computing",
    "The Art of Writing Code Reviews People Actually Read",
    "Shipping Fast Without Breaking Everything",
    "Understanding React's Concurrent Rendering",
    "How to Run a Blameless Postmortem",
    "The Economics of Technical Debt",
    "Building Accessible Forms That Don't Suck",
  ];

  let count = 0;
  for (const title of titles) {
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const author = authors[count % authors.length];
    const category = categories[count % categories.length];
    const postTags = [tags[count % tags.length], tags[(count + 3) % tags.length]];
    const isFeatured = count < 5;
    const isPinned = count < 4;
    const publishedDaysAgo = count * 3 + 1;

    await prisma.post.upsert({
      where: { slug },
      create: {
        title,
        slug,
        subtitle: "A field guide based on what actually happened, not what the marketing site says.",
        contentJson: buildDoc(title),
        contentHtml: html(title),
        excerpt: `A field guide to ${title.toLowerCase()}, based on what actually happened in production — not what the marketing site says.`,
        metaTitle: title,
        metaDescription: `Everything you need to know about ${title.toLowerCase()}, explained clearly with real examples.`,
        coverImageUrl: COVER_IMAGES[count % COVER_IMAGES.length],
        coverImageAlt: title,
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - publishedDaysAgo * 24 * 60 * 60 * 1000),
        readingTimeMinutes: 4 + (count % 8),
        wordCount: 800 + count * 40,
        difficulty: [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED][count % 3],
        summary: `${title} — the short version: measure before you optimize, and prefer boring technology until it hurts.`,
        keyTakeaways: [
          "Start with the simplest solution that could possibly work.",
          "Instrument before you optimize — data beats intuition.",
          "Revisit the decision in six months; context changes.",
        ],
        faq: [
          { question: `Is this relevant if I'm just starting out?`, answer: "Yes — the fundamentals here apply regardless of team size." },
          { question: "How often should I revisit this approach?", answer: "Roughly every two quarters, or after a major traffic/team change." },
        ],
        sources: [{ label: "Original research notes", url: "https://example.com/research" }],
        isFeatured,
        isPinned,
        viewCount: Math.floor(Math.random() * 5000) + 100,
        likeCount: Math.floor(Math.random() * 200),
        clapCount: Math.floor(Math.random() * 400),
        shareCount: Math.floor(Math.random() * 80),
        authorId: author.id,
        categoryId: category.id,
        tags: { connect: postTags.map((t) => ({ id: t.id })) },
      },
      update: {},
    });
    count++;
  }

  // A couple of drafts + one scheduled for CMS demo purposes.
  await prisma.post.upsert({
    where: { slug: "draft-upcoming-post" },
    create: {
      title: "Draft: Upcoming Post",
      slug: "draft-upcoming-post",
      contentJson: buildDoc("an upcoming idea"),
      contentHtml: html("an upcoming idea"),
      status: PostStatus.DRAFT,
      authorId: authors[0].id,
      categoryId: categories[0].id,
    },
    update: {},
  });

  await prisma.post.upsert({
    where: { slug: "scheduled-post-example" },
    create: {
      title: "Scheduled: Next Week's Feature",
      slug: "scheduled-post-example",
      contentJson: buildDoc("a scheduled feature"),
      contentHtml: html("a scheduled feature"),
      status: PostStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      authorId: authors[1].id,
      categoryId: categories[1].id,
    },
    update: {},
  });

  const firstPost = await prisma.post.findFirst({ where: { status: PostStatus.PUBLISHED } });
  if (firstPost) {
    await prisma.comment.createMany({
      data: [
        { postId: firstPost.id, guestName: "Alex R.", guestEmail: "alex@example.com", body: "Great breakdown — the migration section saved me hours.", status: CommentStatus.APPROVED },
        { postId: firstPost.id, guestName: "Jordan T.", guestEmail: "jordan@example.com", body: "Would love a follow-up on the monitoring side of this.", status: CommentStatus.PENDING },
      ],
      skipDuplicates: true,
    });
  }

  await prisma.newsletterSubscriber.createMany({
    data: [
      { email: "reader1@example.com", status: SubscriberStatus.ACTIVE, source: "homepage" },
      { email: "reader2@example.com", status: SubscriberStatus.ACTIVE, source: "footer" },
      { email: "reader3@example.com", status: SubscriberStatus.PENDING, source: "homepage" },
    ],
    skipDuplicates: true,
  });

  console.log(`Seeded ${authors.length} authors, ${categories.length} categories, ${tags.length} tags, ${titles.length + 2} posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
