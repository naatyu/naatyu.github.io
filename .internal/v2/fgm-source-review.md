# Flow Generator Matching source checkpoint — 2026-10-24

Previous goal turn made releasedSiD source/content/test/native progress. This continuation reviewed the next actual source and added missing explanation, not a status-only turn.

## Source and review scope

Primary https://arxiv.org/abs/2410.19310v1 , first submitted25October2024. Onlyv1 is listed. Official HTML https://arxiv.org/html/2410.19310v1 used for full substantive main text/algorithm/equations/tables. PDF /private/tmp/atlas-fgm-2410-19310v1.pdf:21pages,24,153,191bytes,SHA25649abd90f42d786ae5efe7dbc271d55facc62dc5b215f596f1e739879f4f7dd3b. All AppendixA/B proof/recipe/evaluation/prompt text read from PDF16–19; no line-by-line fresh bibliography review or independent certification of cited papers.

Rendered21pages with Poppler using taskFontconfig into /private/tmp/atlas-fgm-figures-NYJKi8/page-01.png ...page-21.png. Render85587 terminal0(64abda). Actual viewed2,4,7,8,9,10,17,20,21. These cover all five figures and four tables plus the inconsistent equations3.5/3.6 and5.1. No primary figure copied or source image repurposed as synthetic evidence. CC-BY4.0 is stated on arXivHTML, but this pass did not need asset reuse.

Substantive main/AppendicesA–B text/figure/table review complete to this scope. No released-code, autograd, checkpoint, CUDA, training, benchmark or formal-proof execution. Formal regularity hypotheses are not fully specified by the paper; a scoped worked Gaussian case is not a theorem certification.

## Important source discrepancies / evidence limits

- PDF4 equation3.5 is (x0−xt)/(1−t), whereas equation3.6 uses xt=(1−t)x0+t*x1 and targetx1−x0. They do not agree. The note explicitly declares data0/noise1 and derives dx/dt=epsilon−x0=(xt−x0)/t for interior time; generation hasnegative dt. It identifies the published inconsistency, rather than silently transcribing an incompatible denominator/sign.
- Main equation4.3's HTML endsGrad1+Grad1; adjacent definitions and AppendixA give the two distinct terms. Not copied as an identity.
- Main equation5.1's generator expression conflicts with AppendixB's parameterization. New public SD3 formula uses exact AppendixB.2: z−.97v(.8z,.97), with empirical input/time choices, not a generic Euler formula.
- CIFAR prose calls2.52 worse than2.58 despiteFIDlowerbeingbetter. Tables use50/100step teacher budgets and the public comparison retains those exact values, not the incorrect ranking sentence.
- Table1 swaps the two unconditionalSiD alpha labels relative to SiD's own primary report. Existing SiD rows remain sourced to SiD; no automatic overwrite from this secondary comparison.
- Figure1 is a selected qualitativeT2I grid; Figure2 compares selected prompts under different step/guidance settings. No full distributional coverage, causal attribution to FGM alone or measured latency is inferred.
- Figure3 and Tables1–2: unconditional teacher50/100FID3.67/2.93,one-stepFGM3.08;conditional3.66/2.87,FGM2.58. The unconditional student does not beat the100stepteacher. Public comparison makes budget explicit.
- Table3: GenEval overall ours.65 versus28stepSD3.70, not identical performance. Source evaluation usesfourimages perprompt,1024px,SD3guidance7,Hyperguidance3/LoRA.125,Flashguidance0; model-specificrecommendedsettings, not matched latency/compute. Public preserves resolution/sample count/settings distinction, not every baseline row.
- Figure4/5: unconditional/conditional sample grids, not proof of no mode collapse/memorization.
- Table4:20,000kimg=20M, batch512,AdamLR2e−5,betas0/.999,EMA.999. Algorithm1 uniform time differs from practicalCIFARlogit-normalpi(0,2). Sourcepi parameterization is not fully defined as varianceversusstd here; do not invent that clarification.
- SD3:~2Mpromptentries,teacherCFG4fortraining,preencodedtexts,FSDP8H80080GB,perdevice4×accum6=192,BF16,AdamLR5e−6/eps1e−6. GeneratorFGMpi(2.4,1),auxflowpi(−1,2). GANgenerator/discriminatorweights.01/.05 andgeneratorlossscale100. GAN uses~500ksynthetic1024pximages andlayer2onlinefeatures; this is not the pure image-data-free objective. Both image experiments omitL1 after reported instability. Public preserves that crucial theoretical-versus-practical distinction; full recipe values remain source evidence, not an untested launch script.

## Public reconciliation and explanatory model

Diffusion gains three stable/searchable sections, no new standalone report:

1. #flow-matching placed beforeShortcut to define interpolation/conditional versus marginal velocity before bootstrapping or FGM. One derivative display and assigned three-row scalar path. Not an invention date claim or forced chronology.
2. #fgm-gradient connects the priorSiD mean-shift example to flow matching. IndependentunitGaussianclean/corruption noises, realmean0/generatormeanθ, exactaffineauxfieldmeanψ heldfixed. V=(1−t)²+t²,a=(2t−1)/V,teacher=ax,student=ax−tψ/V. IdealJ=t²θ²/V²;naiveL1=t²ψ²/V²;correctionL2=2t²ψ(θ−ψ)/V². Atθ=ψ=2,t=.5,value/gradientpairs(4,4),(4,0),(0,4). These are our exact teaching calculations, not source measurements or a claim that droppingL1 is generally correct.
3. #fgm-evidence gives scoped two-rowFIDcomparison,20M/batch/LR/timestep distinction,GAN/L1recipe change,SD3parameterization andGenEvalconditions.

Three new displays bring reader to47sections,37display+45inline=82MathML. Four existing synthetic scenes unchanged. Originalpublication2026-06-11 andupdated2026-10-24 preserved. Fixedalgebra/examples use aligned comparisons; no decorative animation or fabricated empirical plot added.

New purefgmMeanCase has finite/interior/overflow guards. Newtest-fgm-reference.mjs independently evaluates four symmetric Gaussian nodes (exact moments for degree<=3), marginal/conditional flow-product projections, closedlosses and heldψfinite-differencegradients.245cases overtheta/psi/time plus45interpolation derivative/reverse-step cases pass; fiveinvaliddomains rejected. Actualtable/annotations/sourceconditions tested. Projectionidentity uses truefieldmeanθ, not arbitrary approximateψ. No tautological loop over only the closed-form model outputs.

## Final checks

- Focused30463 terminal0(7a8c1c):47sections/fourscenes/15,205renderedwords;existing15,904diffusionnumerical and10,902scene states retained.
- Final full47-script86814 terminal0(b08604); no later public edits.
- Explicitbuild82042 terminal0(9e655d),jvjgjS. Full-suite staticaLJcb5:54readers/206landings/25notices/3,235reviewedlegacyanchors/546displays/1,451namespace-validMathML/15media/544files/zero old dependencies.385comparison/164code regions.
- HTTP7386 terminal0(474160):285routesplusHome/Atlas/custom404/HEAD/query308/private/symlink/405/MIME/reviewheaders.
- NativejvjgjS:1280×900flowconventionandFGMgradient/screenshots;390×844flow/gradient/evidence/SD3math/screenshots.82MathML,zeroKaTeX/document overflow,emptywarn/errorlogs. Mobilemathwidths241/248/274inside232;table600inside258. Gradienttable/evidencetable/SD3equation settle40px;FGMgradientequation reaches16.5pxmaximum. Flowequationreaches8.5pxmaximum. Flowtablefocus/ArrowRightissued,butimmediatepositionreadwas0beforeviewportreset;do not claimsettledmobile40pxthere. Fullwidthdesktopflowtabletheninspected. Broadera11y/BFCache/OSmotion/fullcorpus/tensorchecksnotcertified. Viewportreset,temporarytabclosed,server89493stopped130.
- Rawqueue63,newassignedtheta/psi/timecaptionintentional,notanuntypesetderivation. Whitespacecheckexit0;untrackedv2caveatremains.

## Remaining and boundaries

Next remaining source scopes:Shortcut Models and Su's remaining linkedseries; FGMreleasedimplementationavailability/conventions can be checked proportionally if an official implementation is provided. Whole-corpus editorial/native/accessibility/recovery/release gates still open.232originalsintact;231Git-equalrecoveries and local/untrackedharnessexceptionunchanged. No retirement,commit,push,deploy or production switch.
