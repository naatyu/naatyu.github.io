---
title: "Activation Functions"
date: 2024-10-01
lastmod: 2026-08-10
tags:
  - ai/deep-learning
  - theory/activation-functions
draft: false
---

## Summary

This note explores various activation functions used in neural networks, from standard ReLU to modern Gated variants like SwiGLU.
## Concepts
- **ReLU (Rectified Linear Unit):** an activation function that outputs the input if it is positive, and zero otherwise.
- **Vanishing Gradient:** a problem where gradients become too small for effective weight updates during backpropagation.
- **Dying ReLU:** a condition where neurons permanently output zero and stop learning.
- **Softmax:** a function that converts a vector of values into a probability distribution.
- **GELU (Gaussian Error Linear Unit):** an activation function that weights inputs by their probability in a normal distribution.

## ReLU

La plus connue des fonctions d'activation:
$$f(x)=max(0,x)$$
![Activation Functions 01](/attachments/ai/deep-learning/activation-functions/activation-functions-01.png)
C'est simple à calculer, de même pour les dérivées. Comme ReLU n'a pas de regime saturant, cela permet de contrer l'effet du vanishing gradient, car celui ci n'est pas 'écrasé' et il facilite également le flow du gradient dans le réseau (tanh et sigmoid, une fois dérivées tendent vers 0 pour de très grandes valeurs négatives ou positives). ReLU contre également le vanishing gradient grâce à la sparsité (en mettant l'activation à 0). 
Cependant il y a des problèmes comme le dying relu, par exemple si une neurone ne reçoit que des inputs à zero, celles ci va arrêter d'apprendre. Egalement, ReLU néglige complètement les informations négatives, qui peuvent êtres utiles. ReLU ne possédant pas de borne supérieure, cela peu entrainer une explosion des gradients. 

## Leaky ReLU

Définit par:
$$f(x)=max(\alpha x, x)$$
![Activation Functions 02](/attachments/ai/deep-learning/activation-functions/activation-functions-02.png)
Avec $\alpha$ une constante, petit de façon générale. C'est une amélioration de ReLU pour traiter le problème du dying ReLU quand les inputs sont négatifs.

## Sigmoid

Anciennement utilisé comme fonction d'activation mais abandonné depuis au profits de fonctions comme ReLU a cause du régime de saturation ainsi que du vanishing gradient lors de grands inputs. Définit par:
$$f(x)=\frac{1}{1+e^{-x}}$$
![Activation Functions 03](/attachments/ai/deep-learning/activation-functions/activation-functions-03.png)
La sigmoid est aujourd’hui utilisé principalement en dernière couche pour de la classification binaires, généralement couplée à la [Binary Cross-Entropy Loss](/atlas/ai/training/losses/binary-cross-entropy-loss). 

## Tanh

Définit par:
$$f(x)=\frac{e^x - e^{-x}}{e^x + e^{-x}}$$
![Activation Functions 04](/attachments/ai/deep-learning/activation-functions/activation-functions-04.png)
Proche de la sigmoid mais varie de -1 à 1, aujourd'hui peu utilisé pour les même raisons que la sigmoid (régime saturant et gradient squashing). Utilisé dans les réseaux récurrents. 

## Softmax

Définit par:
$$f(x_i)=\frac{e^{x_i}}{\sum_{j=1}^ne^{x_j}}$$
Utilisé comme couche d'output pour de la classification multi-classes. Permet d'obtenir une distribution de probabilité pour toutes les classes.

Softmax is also the output mapping paired with Shannon entropy and log loss by the Fenchel–Young construction. Alternative generalized entropies lead to mappings such as sparsemax and entmax, which can produce exact zeros. See [Proper Scoring Rules and Fenchel-Young Losses](/atlas/ai/training/losses/proper-scoring-rules-and-fenchel-young-losses).

## GELU

Gaussian Error Linear Unit est une fonction d'activation très populaire, surtout pour les modèles de langues. 
Définit par:
$$f(x)=x*\Phi(x)$$
Avec $\Phi$ la fonction de répartition de la loi normale. Pour des raisons de simplicité de calcul on utilise également sont approximation
$$f(x)=0.5x \times(1 + tanh(\sqrt{2/\pi} \times (x + 0.044715x^3)))$$
![Activation Functions 05](/attachments/ai/deep-learning/activation-functions/activation-functions-05.png)
C'est une sorte de version smooth de ReLU. C'est une fonction non monotone avec une légère tolérance pour les valeurs négatives. Elle permet également de contrer le convariate shift en facilitant la stabilité de la variance par la borne inférieur et la nature quasi linéaire pour les nombres positifs. Le comportement non monotone proche de 0 favorise la propagation des valeurs et aide a maintenir des activations proche de 0. Contre également le dying ReLU. C'est l'une des fonctions d'activation les plus performantes quasi drop in replacement avec ReLU même si plus complexe au calcul (principalement réduit par les frameworks). 

## Swish

Définit par:
$$f(x)=x \times sigmoid(\beta x)$$
![Activation Functions 06](/attachments/ai/deep-learning/activation-functions/activation-functions-06.png)
Possède un paramètre $\beta$ apprenable (souvent mis à 1, recommandé dans le papier de swish). Tres proche de GELU et possède les mêmes propriétés, a différence qu'il y a un paramètre de plus que l'on peut définir. 

La différence entre GELU et Swish se trouve dans la bosse. Apres un entrainement la plupart des activations sont autour de cette bosse. Une bosse différente entraîne un comportement différent de l'activation et donc un apprentissage de complexité plus ou moins différentes.

## GLU

Définit par:
$$f(x)=(Wx+b)\times sigmoid(Vx+c)$$
Gated Linear Unit, c'est une activation basé sur la sigmoïde qui permet de donner une probabilité a la neurone de s'activer. GLU possède des paramètres apprenables et le but du réseau sera d'apprendre comment l'input doit être transformé et quand active cette transformation.

## SwiGLU

Définit par:
$$f(x)=(Wx+b)\times Swish(Vx+c)$$
Comme on peut le voir, cette activation reprend le principe de GLU avec l'aspect apprenable de quand activer la neurone mais  utilise une activation Swish plutôt que sigmoïde. Les avantages de Swish sont clairement supérieur à la sigmoide (vanishing gradient). En revanche il n'y a pas d'explications claires de pourquoi est ce qu'elle marche aussi bien. Ce qui ressort potentiellement c'est que par le nombre de paramètres apprenable, on peut obtenir un grand nombre de shapes différentes pour cette activation ce qui la rend très expressive. 

## Silu

Définit par:
$$f(x)=x\times sigmoid(x)$$
Même avantages que Swish avec le $\beta$ en moins.

## Hardtanh

Le **Hardtanh** est une version "linéaire par morceaux" de la fonction Tanh. Elle borne l'output dans un intervalle spécifié (par défaut $[-1, 1]$) tout en restant linéaire entre ces bornes.

Définit par :
$$\text{Hardtanh}(x) = \begin{cases} \text{min\_val} & \text{si } x < \text{min\_val} \\ x & \text{si } \text{min\_val} \le x \le \text{max\_val} \\ \text{max\_val} & \text{si } x > \text{max\_val} \end{cases}$$

### Caractéristiques
- **Plage de sortie** : Bornée $[min\_val, max\_val]$. Par défaut $[-1, 1]$.
- **Linéarité** : Contrairement à Tanh qui est courbe, Hardtanh est l'identité ($f(x)=x$) dans sa zone active.
- **Dérivée** :
  $$\frac{d}{dx}\text{Hardtanh}(x) = \begin{cases} 0 & \text{si } x < \text{min\_val} \\ 1 & \text{si } \text{min\_val} \le x \le \text{max\_val} \\ 0 & \text{si } x > \text{max\_val} \end{cases}$$

### Comparaison

| Propriété | Hardtanh | Tanh | ReLU |
| :--- | :--- | :--- | :--- |
| **Borne Inférieure** | $min\_val$ | -1 (asymptotique) | 0 |
| **Borne Supérieure** | $max\_val$ | 1 (asymptotique) | Aucune |
| **Régularité** | Linéaire par morceaux | Lisse (Smooth) | Linéaire par morceaux |
| **Coût Calcul** | Très faible | Élevé (Exponentielles) | Très faible |

### Cas d'utilisation
- **Réseaux Quantifiés** : Les frontières franches s'alignent bien avec les représentations en virgule fixe.
- **Réseaux Récurrents (RNN)** : Utilisé pour éviter l'explosion des activations sur de longues séquences sans le coût des fonctions hyperboliques.
- **Régularisation** : Permet de limiter naturellement la magnitude des activations sans "écraser" le gradient dans la zone centrale.
