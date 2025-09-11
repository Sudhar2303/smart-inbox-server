import app from "./app"
import connectDB from "./database/connection"

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
  console.error("DB connection failed", error);
  process.exit(1);
});

