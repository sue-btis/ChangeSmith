# Evidence for the comment budget

Measured basis for the rules `comment-budget.mjs` applies. The remaining figures are in the script header.

**Why density is not measured**

- Variance within one language exceeds the variance between languages: Java averages 25.9% with a standard deviation of 11.1%.
- A project's purpose weighs about 9 times more than its language: educational Java reaches 57%, applications 6%.
- About 59% of comment lines in real code are licenses, TODOs and commented-out code, which no density figure should judge.
- SonarQube published a 25% density rule, deprecated it and removed it in version 10.0. No linter for any language enforces a maximum density.

**Tagged docs are contract**

`<summary>`, `<param>` and `<response>` feed OpenAPI's `schema.Description` and `parameter.Description`. `@param` and `@returns` feed TSDoc and API Extractor. `Args:` and `Returns:` are docstrings, and `///` produces dartdoc and rustdoc doctests. They are never touched, whatever their volume. Microsoft's official OpenAPI sample has DTOs with 2.0 to 2.5 doc lines per code line, and that is correct.

**Untagged blocks: one sentence, about 40 words at most**

- A real summary comment averages 1.4 lines (Pascarella, MSR 2017).
- In TypeScript published on npm, the 75th percentile is 19 words.
- The only maximum-size rule in a mainstream linter, PMD's `CommentSize`, cuts at 6 lines.

**Inline comments**

Measured across 20 repositories and npm, they stay at a p90 of 2 to 4 lines on their own, so they need no budget.
