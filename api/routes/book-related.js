import { Hono } from "hono";

// Create book related router
const bookRelatedRouter = new Hono();

// Related books endpoint
bookRelatedRouter.get("/", async (c) => {
	const bookId = c.req.param("id");
	const sql = c.env.SQL;

	const book = await sql`SELECT * FROM public.books WHERE id = ${bookId}`;

	if (book.length === 0) {
		return Response.json({ error: "Book not found" }, { status: 404 });
	}

	let relatedBooks = [];
	let recentBooks = [];
	let genreCounts = [];

	const bookGenre = book[0].genre;

	relatedBooks = await sql`
      SELECT * FROM public.books 
      WHERE genre = ${bookGenre} AND id != ${bookId}
      LIMIT 3`;

	genreCounts = await sql`
      SELECT genre, COUNT(*) as count 
      FROM public.books 
      GROUP BY genre 
      ORDER BY count DESC`;

	recentBooks = await sql`
      SELECT * FROM public.books 
      WHERE id != ${bookId} 
      ORDER BY created_at DESC 
      LIMIT 2`;

	return Response.json({
		bookId: bookId,
		bookGenre: bookGenre,
		relatedBooks,
		recentRecommendations: recentBooks,
		genreStats: genreCounts,
		source: "database",
	});
});

export default bookRelatedRouter;
