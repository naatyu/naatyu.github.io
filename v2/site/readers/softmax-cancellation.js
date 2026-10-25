import {texEq,inlineMath} from './math.js';
import {cite} from './topic-tools.js';
import {softmaxFixPaper} from './softmax-precision.js';
export function softmaxCancellationContent(link){return `
<p>A correct distillation objective can still have an inaccurate floating-point derivative. This matters most near a match, when the true update should be tiny. Barron et al. (2026) call this softmax cancellation; it is distinct from the high-confidence collapse described in <a href="${link('training/objectives#softmax-precision')}">Losses and Objectives</a>.</p>
<p>Keep this note's convention: q is the fixed teacher and p is the student, both evaluated at the same temperature and vocabulary ordering. Before temperature weighting, the exact soft-target logit gradient is p−q. Computing the two probability vectors separately can lose their small difference. A forward softmax and a backward exp(log-softmax) can also follow different rounding paths, leaving a residual even at identical logits.</p>
<div class="precision-operation"><span>Identical logits, deterministic model, teacher detached</span><code>student = teacher → p − q = 0 → no data-gradient update</code></div>
<p>The cross-entropy value need not be zero here: it equals the teacher's entropy. The student gradient and forward KL should be zero in exact arithmetic. A nonzero scalar cross-entropy is not evidence that the matched student needs further training.</p>
<h3>Preserve the difference before probabilities erase it</h3>
<p>The paper takes teacher logits as an input to the loss. It starts from the student–teacher logit difference and evaluates the probability difference using expm1 and log1p. These functions preserve small deviations near zero better than forming exp(x)−1 or log(1+x) directly.</p>
${texEq(String.raw`\begin{aligned}\delta_i&=(z_{S,i}-z_{T,i})/\tau,\qquad d_i=\delta_i-\sum_jq_j\delta_j\\s_i&=d_i-\operatorname{log1p}\!\left(\sum_jq_j\operatorname{expm1}(d_j)\right)\\u_i&=q_i\operatorname{expm1}(s_i)\end{aligned}`,'In exact arithmetic sᵢ=log(pᵢ/qᵢ) and uᵢ=pᵢ−qᵢ. Finite logits and normalized teacher probabilities are assumed. This formulation targets nearby distributions; large differences still require overflow/domain checks.')}
<p>The construction then removes residual zero-sum drift with:</p>
${texEq(String.raw`g_i=u_i-p_i\sum_j u_j`,'This correction follows a cancellation-aware difference u, not an arbitrary projection of an already corrupted gradient. If δ=0, expm1(0)=0 gives u=g=0. Floating-point reductions elsewhere still need their own tests.')}
<pre><code># Pedagogical gradient calculation; p = student, q = fixed teacher.
# z_s and z_t below are already temperature-scaled logits.
delta = z_s - z_t
d = delta - (q * delta).sum(-1, keepdim=True)
s = d - log1p((q * expm1(d)).sum(-1, keepdim=True))
u = q * expm1(s)
g = u - p * u.sum(-1, keepdim=True)</code></pre>
<p>This computes a gradient, not a scalar loss that ordinary autodiff should differentiate again. The paper uses a stop-gradient construction to retain the forward cross-entropy while injecting g into the backward pass. A custom backward needs a deliberate contract: its reference implementation targets the student gradient with a fixed teacher, not arbitrary higher-order derivatives or a trainable teacher.</p>
<p>Here g differentiates with respect to the temperature-scaled student logits. With this note's ${inlineMath(String.raw`\tau^2`)} objective weight, the gradient with respect to the original student logits is ${inlineMath(String.raw`\tau g`)}. Keep masks and reduction factors too; do not apply temperature scaling twice.</p>
<h3>A sanity check before a long distillation run</h3>
<ol><li>Copy teacher weights into the student. Match tokenizer, input, temperature and support; disable dropout and other stochastic differences.</li><li>Detach teacher targets and inspect the student gradient on a nonempty valid mask before taking an optimizer step. Compare exact equality and small representable logit perturbations against a higher-precision reference.</li><li>For a no-drift optimizer test, also disable weight decay and other losses, and reset momentum/optimizer state. Otherwise parameters can move despite a zero current data gradient.</li><li>Repeat with the actual loss kernel, compiler and intermediate dtypes. FP32 reduces many errors but does not prove cancellation is absent.</li></ol>
<p>In the paper's controlled test, the teacher solves modular addition modulo 53 and the student starts from the same weights. Adam runs for 2,000 steps with learning rate 0.002, ε=10⁻⁸, no weight decay and temperature 4. The tested standard loss produces student drift, strongest in BF16; the corrected loss preserves the matched solution. This is a diagnostic experiment, not evidence that every real distillation run suffers a large accuracy penalty.</p>
<p>${cite(softmaxFixPaper+'#S3','Derivation and reference backward')} · ${cite(softmaxFixPaper+'#S7','Controlled matched-student experiment')}. The usual log-softmax/FP32 sketch later in this note remains a useful baseline, not a guarantee of exact near-match gradients.</p>`;}
