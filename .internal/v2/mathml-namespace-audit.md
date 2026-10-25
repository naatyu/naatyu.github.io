# MathML namespace repair — 2026-10-12

Previous goal turn made hidden-caption progress. The earlier broad tag scan also exposed generated math descendants in the HTML namespace. Fresh math helper,affected expressions,current topic audit openings and regression tests inspected. Scoped reproductions confirm bundled-renderer output,not a new scientific-content error. Six static formulas across five readers were affected:

| Reader | Formula | Equivalent repair |
| --- | --- | --- |
| Tokenization | Constrained segmentation argmax | Starred named operator with subscript constraint |
| Training Data | Simplex surrogate argmin | Starred named operator with subscript constraint |
| Statistics | Fold-count remainder | Named `mod` operator |
| Bits/Numbers | Modular addition/multiplication and cycle index | Named `mod` operator in both formulas |
| Compact Recipes | Cache reduction at rotary fraction1/4 | Ordinary equality plus explicit parenthesized condition |

Previously,the math-token element wrapped nested markup that HTML parsing placed outside the MathML namespace. Exact alternative renderer outputs and parsed trees were tested before edits. Visual semantics,conditions,calculations,counts and reported values preserved;this pass does not reread/certify all external papers. Display/inline counts unchanged. Source publication dates retained;affected update dates2026-10-12. No vendor patch or dependency added.

`foreignMathNodes` now checks every descendant inside a parsed MathML root. Two independently constructed malformed token/operator structures fail;valid operator structures and outside-math HTML pass. Representative repaired TeX and exact owning-reader annotations tested. Default static suite imports the guard:1,064static formulas across54readers have zero foreign-namespace descendants. This is not a complete grammar check or proof of screen-reader compatibility;dynamic/scene math and assistive-technology behavior remain separate.

Focused49331 observedexit0:all five owning-topic suites and new namespace check pass. Existing independently checked algorithm/group/fold/recipe evidence remains covered. CandidateQo8pw7 builds54/206/25/252resources/15media/zero old dependencies. Final full47-script27874 observed terminal exit0 after all code edits;staticspo4wL54/206/25/3235/535displays/15images/544files/zero old dependencies. Corpus33255exit0:232originals unchanged,231Git-equal plus sole untracked harness,206reviewed primary/3235fragment destinations valid. gitdiffcheckexit0,but untracked migration files require their dedicated checks.

NativeQo8pw7:all five notes at1280and390px have zero wrong namespaces,matherrors or page overflow. Mobile argmax,argmin,modulo and explicit cache-condition screenshots inspected. Cache equation280pxwithin232px named local surface responds toArrowRight with40pxscroll and focus. End instead scrolled the page,so no local-End capability is claimed. Browser warning/error logs empty;viewport reset,temporary tab closed,preview53940stoppedexit130. No assistive-technology or whole-native-corpus certification inferred.

Original bodies/production untouched;no original retirement,commit,push or deployment. Broader primary/figure/editorial,remaining raw/dynamic math,accessibility/lifecycle and production-switch/recovery gates remain. Goal active.
