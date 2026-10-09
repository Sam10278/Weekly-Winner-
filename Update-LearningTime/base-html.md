# Base HTML Template and Bootstrap — How It Works

## What is the Base HTML Template?

The base HTML template provides a reusable starting structure
for the Every Week a Winner frontend.

Instead of writing the same HTML structure for every page,
developers can use this template to maintain consistency
throughout the application.

## Section 1 — HTML Structure

The template includes the standard HTML5 structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">
    <title>Every Week a Winner</title>
</head>
<body>

</body>
</html>
```

### Explanation

- DOCTYPE tells the browser to use HTML5.
- The language attribute identifies the document language.
- UTF-8 supports different characters and symbols.
- The viewport tag makes the page responsive.
- The title appears in the browser tab.

## Section 2 — Bootstrap Integration

Bootstrap is a CSS framework used to create responsive
and consistent website layouts.

The template loads Bootstrap through a CDN.

```html
<link
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
  rel="stylesheet">
```

### Why Bootstrap?

- Provides responsive layouts.
- Includes reusable UI components.
- Reduces the amount of custom CSS required.
- Helps maintain consistent styling.

## Section 3 — Shared Navigation

The template includes placeholders for shared navigation.

This allows developers to maintain a consistent navigation
structure across different pages.

The navigation can later be customized with links to:

- Home
- Login
- Categories
- Brackets
- Leaderboard

## Section 4 — Reusing the Template

To create a new frontend page:

1. Open `frontend/pages/base.html`.
2. Copy the HTML structure.
3. Create a new HTML file inside `frontend/pages/`.
4. Replace the placeholder content.
5. Update the page title.
6. Add any page-specific styling or scripts.

Note: Plain HTML does not automatically inherit another
HTML file. The template must be copied or integrated
through a templating system.

## Section 5 — Testing

The template was reviewed to verify:

- Correct HTML5 structure.
- Bootstrap CDN reference.
- Shared navigation placeholders.
- Proper organization of frontend files.

## What I Learned

This task helped me understand how reusable HTML templates
improve maintainability and consistency.

I also learned how Bootstrap can simplify responsive
frontend development.

## Contribution

Developer: Sujit Lopchan(10/8/2026)