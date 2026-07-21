export function validatePostData(req, res, next) {
  const { title, image, category_id, description, content, status_id } = req.body;

  // 1. title validation
  if (title === undefined || title === null || title === "") {
    return res.status(400).json({ message: "Title is required" });
  }
  if (typeof title !== "string") {
    return res.status(400).json({ message: "Title must be a string" });
  }

  // 2. image validation
  if (image === undefined || image === null || image === "") {
    return res.status(400).json({ message: "Image is required" });
  }
  if (typeof image !== "string") {
    return res.status(400).json({ message: "Image must be a string" });
  }

  // 3. category_id validation
  if (category_id === undefined || category_id === null || category_id === "") {
    return res.status(400).json({ message: "Category ID is required" });
  }
  if (typeof category_id !== "number" || Number.isNaN(category_id)) {
    return res.status(400).json({ message: "Category ID must be a number" });
  }

  // 4. description validation
  if (description === undefined || description === null || description === "") {
    return res.status(400).json({ message: "Description is required" });
  }
  if (typeof description !== "string") {
    return res.status(400).json({ message: "Description must be a string" });
  }

  // 5. content validation
  if (content === undefined || content === null || content === "") {
    return res.status(400).json({ message: "Content is required" });
  }
  if (typeof content !== "string") {
    return res.status(400).json({ message: "Content must be a string" });
  }

  // 6. status_id validation
  if (status_id === undefined || status_id === null || status_id === "") {
    return res.status(400).json({ message: "Status ID is required" });
  }
  if (typeof status_id !== "number" || Number.isNaN(status_id)) {
    return res.status(400).json({ message: "Status ID must be a number" });
  }

  next();
}
