---
title: 'Sonar Avoidance'
description: 'Vision-inspired local avoidance algorithm for RTS agents that projects nearby obstacles into angular space and selects collision-free steering directions in real time. By reducing avoidance to a 1D angular domain, it achieves fluid group movement while preserving precise and responsive unit control.'
pubDate: 'Feb 19 2026'
heroImage: '../../assets/images/agents-navigation.png'
category: 'Game AI'
tags: ['ai', 'navigation']
---

# Sonar Avoidance

Sonar Avoidance is a local avoidance algorithm for RTS agents that I created for my own game. It is heavily inspired by StarCraft II and the GDC 2011 talk [AI Navigation: It's Not a Solved Problem - Yet](https://www.gdcvault.com/play/1014514/AI-Navigation-It-s-Not). Since the talk did not go into algorithmic details and only presented high-level concepts, I consider this implementation fully my own. However, I would not be surprised if someone else independently created something similar under a different name.

In this article, I will cover the history of how I came up with the algorithm and explain in detail how it works.

For those interested, Sonar Avoidance is available in Unity. It can be purchased as a standalone local avoidance system under [Local Avoidance](https://assetstore.unity.com/packages/tools/behavior-ai/local-avoidance-214347) or with full NavMesh integration under [Agents Navigation](https://assetstore.unity.com/packages/tools/behavior-ai/agents-navigation-239233). Since 2022, these packages have been downloaded approximately 23,000 times and successfully released in many games. While that number may not sound enormous, these are developers using the system in their own projects, not end users. For that reason, I consider it a significant success and one of the main motivations behind writing this article and sharing insights about the algorithm.

---

## History of the Algorithm

In this section I will cover the motivation behind the algorithm and how it evolved. If you are mainly interested in technical details, you can skip this section.

---

### Warcraft

Naturally, I began developing a Warcraft III inspired mobile project.
In 2014 I started working in Unity this is where I discovered the Unity Engine as tool for creating the games. I quickly fell in love with the tool and decided that I want to create the game with it. This then I started developing my wacraft 3 mobile knock-off.
<div style="max-width:500px;">
  <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
    <iframe
      src="https://www.youtube.com/embed/knjl9LzwPfU"
      title="Warcraft On Mobile"
      style="position:absolute;top:0;left:0;width:100%;height:100%;"
      frameborder="0"
      allowfullscreen>
    </iframe>
  </div>
</div>

Looking back, directly copying Warcraft III, even for mobile, was not the best idea. It would not have passed Google Play or the App Store. At the time, however, I had the naive hope that Blizzard might become interested in the project. That never happened, but I did try.

The reason I chose this project goes back even further. In my teenage years I was deeply invested in Warcraft III modding. Warcraft III had a tool called the World Editor, which allowed creation of what were called maps. These maps could later be hosted in multiplayer and played by others. The editor was extremely powerful and, in my opinion, one of Blizzard’s greatest creations.

---

## Navigation Solution

One of the most important features of any RTS game is agent navigation. If it does not feel right, players quickly become frustrated.

---

### Unity Navigation

Since I was building the game in Unity, I initially used their built-in solution. It consisted of global navigation using a navigation mesh and local avoidance using [ORCA](https://gamma.cs.unc.edu/ORCA/).

A [Navigation Mesh or navmesh](https://en.wikipedia.org/wiki/Navigation_mesh) is a triangulated representation of walkable areas in the game world. Obstacles are excluded from the mesh. Pathfinding is typically performed using the [A* Search Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm) between start and destination nodes.

NavMesh generation is expensive, but it produces far fewer nodes than grid-based systems. Because rebuilding is costly, it is generally used only for static obstacles such as buildings.

For dynamic avoidance between moving agents, Unity used [ORCA](https://gamma.cs.unc.edu/ORCA/). ORCA is an extension of RVO designed to provide more accurate multi-agent avoidance.

In many scenarios, ORCA works very well. It produces convincing crowd behavior and handles dense group motion nicely. However, in RTS-style gameplay, several issues became apparent.

---

### Problems with ORCA

The first major issue appeared in classic RTS situations where units try to surround a target.

With ORCA, agents often clumped on one side instead of properly surrounding the target. In games like Warcraft III, where each unit is important, this is unacceptable because some units would simply stand idle instead of attacking.

The second issue was ORCA’s reliance on velocity modulation. This makes sense in crowd simulations, and there are many papers explaining how density-based velocity adjustment performs well in high congestion scenarios.

However, in RTS games, high congestion is less frequent and large groups often move toward objectives. In such cases, reducing velocity becomes a drawback because units no longer maximize their speed. If you are micro-managing a single unit, you do not want it to slow down unnecessarily just to accommodate nearby agents.

The third issue was ORCA’s difficulty escaping concave formations. Agents entering these situations could become permanently stuck.

After encountering these problems, I concluded that NavMesh combined with ORCA would not be sufficient for my game.

---

## Researching Alternatives

Around 2016 it was surprisingly difficult to find detailed information about navigation systems used in successful RTS games. Most information was sparse and surface level.

My assumption was that navigation quality plays a major role in RTS success, so companies treated their solutions as proprietary. That may or may not be true, but public technical information was limited.

---

### Warcraft III Navigation

The obvious first reference was Warcraft III.

From my investigation, Warcraft III used a grid-based solution for both global navigation and local avoidance.

In grid-based navigation, the world is divided into fixed-size nodes. Each node indicates whether it is traversable. Agents run [A* Search Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm) to find a sequence of nodes connecting start and destination.

In Warcraft III, army sizes were usually limited by resource caps. However, when those limits were removed using the editor, performance degraded significantly. Groups of 100 or more units began blocking each other, jittering, and behaving poorly.

The main limitation was the discrete nature of the system. It lacked the fluid motion seen in StarCraft II.

Although I was recreating Warcraft III style gameplay, I wanted better navigation quality, so I decided against using a purely grid-based approach.

---

### Supreme Commander 2 Navigation

Another game that impressed me even more in terms of large-scale movement was Supreme Commander 2.

Large armies could pass through each other with very fluid motion.

From research I found they were using a modified version of [Continuum Crowds](https://grail.cs.washington.edu/projects/crowd-flows/continuum-crowds.pdf). It is a grid-based approach that uses [flow fields](https://en.wikipedia.org/wiki/Flow_(mathematics)).

In a flow field, each grid node stores a direction guiding agents toward a shared goal. Instead of each agent computing an individual path, the environment provides a velocity field.

You can imagine the field as an ocean and the goal as a vortex. No matter where you place the agent, it flows toward the destination.

Continuum Crowds incorporates density and velocity information to produce highly fluid group motion.

The main limitation of flow fields is that path calculation happens for shared goals across the whole graph. This makes them extremely efficient for large groups with the same objective, but inefficient when many agents have different goals or when maps are very large.

Supreme Commander 2 was clearly designed around this limitation. Large groups share goals and there are fewer individually controlled units. In Warcraft-style games you have many independent agents such as workers, heroes, and neutral units.

---

### StarCraft II Navigation

Eventually I returned to StarCraft II. To this day, StarCraft II is widely considered one of the best navigation implementations in RTS games. It was done so well that some professional players disliked it because it reduced the mechanical difficulty of unit control that was very relevant in StarCraft I.

Finding reliable information about its navigation system was challenging. Blizzard kept technical details minimal.

Through experimentation and observation, I concluded that StarCraft II used NavMesh for global navigation and a proprietary local avoidance solution.

The only meaningful public source I found was the GDC 2011 talk [AI Navigation: It's Not a Solved Problem - Yet](https://www.gdcvault.com/play/1014514/AI-Navigation-It-s-Not).

The talk focused more on design challenges than technical implementation. They confirmed NavMesh usage and explained how they handled rebuilding efficiently. Their solution appeared simpler and more 2.5D-focused compared to Unity’s more general 3D NavMesh.

The key hint about avoidance was that it behaved almost like a vision-based system. Agents seemed to look ahead, detect openings, and steer through available gaps.

That observation became the foundation of what later evolved into Sonar Avoidance.

## Algorithm

The idea of sonar avoidance is simple at its core. Imagine each agent has a field of view similar to humans, roughly 200–220° horizontally and 130–135° vertically.

As in most games, we do not need full 3D perception. We ignore the vertical field of view and consider only the horizontal plane. This reduces the problem from a 2D angular space (horizontal + vertical) to a 1D angular domain.

We represent the horizontal field of view as an angular interval centered at the agent’s forward direction:

$$
\theta \in [\theta_{\min}, \theta_{\max}]
$$

We treat this interval as a 1D range where $\theta_{\min}$ is the left boundary, $\theta_{\max}$ is the right boundary, and $0^\circ$ is the desired forward direction.

---

### Splitting the Field of View

For convenience, we split the interval into two subranges:

$$
V = \left\{ [\theta_{\min}, 0], \; [0, \theta_{\max}] \right\}
$$

This separates the field of view into negative (left) and positive (right) angles relative to the forward direction.

---

### Obstacle Projection into Sonar Space

Each obstacle blocks part of the agent’s field of view. The closer and larger the obstacle, the larger the angular interval it blocks. Obstacles outside the vision radius are ignored.

We define a function that transforms a static obstacle from world space into angular (sonar) space:

$$
f_{\text{static}}(\mathbf{p}_i, r_i) \rightarrow I_i
$$

The vector $\mathbf{p}_i \in \mathbb{R}^2$ is the obstacle position, $r_i$ is its radius, and $I_i \subset [\theta_{\min}, \theta_{\max}]$ is the blocked angular interval.

First, we convert the obstacle position into agent local space:

$$
\tilde{\mathbf{p}}_i = R(\mathbf{p}_i - \mathbf{p}_a), 
\qquad 
\tilde{r}_i = r_i + r_a
$$

The vector $\mathbf{p}_a \in \mathbb{R}^2$ is the agent position, $r_a$ is the agent radius, and $R$ is the rotation aligning the desired direction with $0^\circ$.

The obstacle angle and half-blocking angle are:

$$
\theta_i = \operatorname{atan2}(\tilde{p}_{i,y}, \tilde{p}_{i,x}),
\qquad
\varphi_i = \arcsin\left( \frac{\tilde{r}_i}{\|\tilde{\mathbf{p}}_i\|} \right)
$$

The resulting blocked interval is:

$$
f_{\text{static}}(\mathbf{p}_i, r_i) 
=
[\theta_i - \varphi_i, \; \theta_i + \varphi_i]
$$

---

### Cutting Visible Ranges

For each blocked interval $I_i$, we subtract it from the current set of visible ranges.

Each subtraction may remove a range entirely, shrink a range, or split a range into two smaller ranges.

After processing all obstacles, we obtain a set of valid angular intervals:

$$
R = \{ I_0, I_1, \dots, I_n \}
$$

Each interval $I_k = [\alpha_k, \beta_k]$ represents a collision-free angular range.

---

### Selecting the Best Direction

Each interval in $R$ represents a set of safe directions.

The agent typically has a desired direction $\theta_d$ coming from global path planning.  
Since all obstacles are converted to local space, we assume:

$$
\theta_d = 0
$$

We select the interval in $R$ closest to $\theta_d$.

The optimal steering angle is $0$ if it lies inside some interval. Otherwise, it is the boundary value minimizing $|\theta - \theta_d|$.

If $R = \emptyset$, the agent is fully blocked and must apply a fallback strategy such as slowing down, rotating in place, or using a higher-level decision.

---

## Persistent State

The static formulation works well for static obstacles. However, without persistent state, the agent may oscillate between directions.

To mitigate this, we incorporate the current velocity direction $\theta_v$.

We define a cost function:

$$
C(\theta) 
=
(1 - w)\, d(\theta, \theta_d) 
+
w\, d(\theta, \theta_v)
$$

The function $d(\theta_1, \theta_2)$ denotes the minimal angular distance, and $w \in [0,1]$ controls how strongly the current velocity influences the decision.

For each interval $I_k$, we evaluate boundary angles $\theta \in \{\alpha_k, \beta_k\}$ and select the one minimizing $C(\theta)$. This biases the solution toward directions consistent with the current motion and reduces oscillations.

---

## Dynamic Obstacles

Applying the static solution to dynamic agents often produces V-shaped formations. Each agent predicts a collision even if all agents move at identical velocities and would never intersect.

To handle dynamic obstacles, we account for relative velocity.

We define:

$$
f_{\text{dynamic}}(\mathbf{p}_i, \mathbf{v}_i, r_i) \rightarrow I_i
$$

The vector $\mathbf{p}_i \in \mathbb{R}^2$ is the obstacle position, $\mathbf{v}_i \in \mathbb{R}^2$ is its velocity, and $r_i$ is its radius.

A collision occurs if there exists $t > 0$ such that:

$$
\left|
(\mathbf{p}_i + \mathbf{v}_i t)
-
(\mathbf{p}_a + \mathbf{v}_a(\theta_g) t)
\right|
=
r_i + r_a
$$

The vector $\mathbf{p}_a$ is the agent position, $r_a$ is the agent radius, and $\mathbf{v}_a(\theta_g)$ is the agent velocity parameterized by steering angle $\theta_g$ with constant speed $s_a$:

$$
\mathbf{v}_a(\theta_g)
=
s_a
\begin{bmatrix}
\cos \theta_g \\
\sin \theta_g
\end{bmatrix}
$$

We convert everything into agent local space:

$$
\tilde{\mathbf{p}}_i = R(\mathbf{p}_i - \mathbf{p}_a),
\qquad
\tilde{\mathbf{v}}_i = R(\mathbf{v}_i),
\qquad
\tilde{r}_i = r_i + r_a
$$

The relative-motion condition becomes:

$$
\left|
\tilde{\mathbf{p}}_i
+
(\tilde{\mathbf{v}}_i - \mathbf{v}_a(\theta_g)) t
\right|
=
\tilde{r}_i
$$

Solving this system for $t$ and $\theta_g$ determines whether a future collision occurs and which angular interval must be blocked.

Agents moving in parallel at identical velocity will have zero relative velocity and therefore generate no blocking interval, preventing unnecessary avoidance.

Solving this function is the most computationally expensive part of the sonar avoidance algorithm.


---

## Navmesh Integration

Integrating sonar avoidance with a navmesh is straightforward.  
The agent collects all nearby navmesh edges and constructs static line obstacles from them.

We define:

$$
f_{\text{wall}}(\mathbf{p}_{i,s}, \mathbf{p}_{i,e}) \rightarrow I_i
$$

The vectors $\mathbf{p}_{i,s} \in \mathbb{R}^2$ and $\mathbf{p}_{i,e} \in \mathbb{R}^2$ denote the start and end positions of the $i$-th navmesh edge.  
The interval $I_i \subset [\theta_{\min}, \theta_{\max}]$ represents the blocked angular range generated by that edge.

As with static circular obstacles, the edge endpoints are transformed into agent local space.  
The resulting angular interval is then subtracted from the visible range set $R$.

---

## Smart Stop

The algorithm typically terminates when the agent is sufficiently close to its destination.  
However, like most local avoidance algorithms, sonar avoidance does not guarantee convergence in all scenarios.

Therefore, a higher-level mechanism is required to detect pathological cases and terminate early.

Two simple strategies are sufficient to handle most remaining scenarios.  
We call them **Hive Mind Stop** and **Give Up Stop**.

---

### Hive Mind Stop

Hive Mind Stop solves termination in group movement.

When multiple agents move toward the same destination, typically only one reaches it, while others may oscillate around it indefinitely.

To address this, each agent that is within a small threshold distance from the destination inspects nearby dynamic obstacles.  
If neighboring agents are already stopped, have a similar destination, and are within proximity, the agent also stops.

This produces stable group termination behavior.

---

### Give Up Stop

Give Up Stop handles situations where an agent becomes stuck in complex concave obstacle formations.

Each agent maintains a progress variable:

$$
t_{\text{giveup}} \in [0, t_{\text{giveup,max}}]
$$

The variable is initialized as:

$$
t_{\text{giveup}} = 0
$$

At each update step, the agent scans nearby dynamic obstacles.

If blocking conditions persist, the timer increases:

$$
t_{\text{giveup}} \leftarrow \min\left(t_{\text{giveup,max}}, \, t_{\text{giveup}} + \Delta t \right)
$$

Otherwise, it decreases:

$$
t_{\text{giveup}} \leftarrow \max\left(0, \, t_{\text{giveup}} - \Delta t \right)
$$

If

$$
t_{\text{giveup}} = t_{\text{giveup,max}}
$$

the agent terminates movement.

This mechanism allows temporary congestion while preventing infinite oscillation in deadlock configurations.

---

## Optimization

Sonar avoidance is computationally expensive, and the cost increases with the number of obstacles.

Limiting evaluation to the $n$ closest obstacles provides stable computational cost with a manageable reduction in avoidance quality.
