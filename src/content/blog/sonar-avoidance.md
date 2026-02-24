---
title: 'Sonar Avoidance: An Alternative to Traditional RVO'
description: 'Vision-inspired local avoidance algorithm for RTS agents that projects nearby obstacles into angular space and selects collision-free steering directions in real time. By reducing avoidance to a 1D angular domain, it achieves fluid group movement while preserving precise and responsive unit control.'
pubDate: 'Feb 19 2026'
heroImage: '../../assets/images/agents-navigation.png'
category: 'Game AI'
tags: ['ai', 'navigation']
---

# Sonar Avoidance

Sonar Avoidance is a local avoidance algorithm for RTS agents that I created for my own game. It is heavily inspired by StarCraft II and the GDC 2011 talk [AI Navigation: It's Not a Solved Problem - Yet](https://www.gdcvault.com/play/1014514/AI-Navigation-It-s-Not). Since the talk did not go into algorithmic details and only presented high-level concepts, I consider this implementation fully my own. However, I would not be surprised if someone else independently created something similar under a different name.

In this article, I will cover the history of how I came up with the algorithm and explain in detail how it works.

For those interested, Sonar Avoidance is available in Unity. It can be purchased as a standalone local avoidance system under [Local Avoidance](https://assetstore.unity.com/packages/tools/behavior-ai/local-avoidance-214347) or with full NavMesh integration under [Agents Navigation](https://assetstore.unity.com/packages/tools/behavior-ai/agents-navigation-239233). Since 2022, these packages have been downloaded approximately 23,000 times and have been successfully used in several released games, indicating strong demand for a more game-ready navigation solution.

---

## History of the Algorithm

In this section I will cover the motivation behind the algorithm and how it evolved. If you are mainly interested in technical details, you can skip this section.

---

### Warcraft

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

In RTS games, movement is a core gameplay mechanic, not just a way to travel between points. Units are constantly redirected, split, grouped, and micro-managed under pressure. If they get stuck, jitter, block each other, or take visibly poor paths, the game feels unreliable and unresponsive.

Good navigation becomes invisible. Units flow naturally around obstacles, surround targets efficiently, and execute commands precisely. For this reason, navigation is not just a technical system but a fundamental part of game feel and competitive integrity.

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

### Analogy to Human Vision

The Sonar Avoidance Algorithm can be understood through a simple human analogy. When people walk forward, they perceive the world as a forward-facing field of view centered around where they are looking. Static obstacles visually occupy a portion of that field. If something appears slightly to the left or right, we instinctively avoid walking into the angular region it occupies. In other words, obstacles “block” parts of our visual space, and we naturally choose a direction outside those blocked angles.

For moving obstacles, humans go one step further. We do not react only to where someone is, but also to where they are going. Subconsciously, we predict whether our current walking direction would intersect with their future path. If it would, we slightly adjust our heading so the projected trajectories no longer collide.

The algorithm mirrors this behavior mathematically. It treats perception as an angular field centered at $0$, converts obstacles into blocked angular intervals, and for dynamic objects evaluates whether a candidate steering angle $\theta$ would produce a future collision. Safe angles remain available, and the agent selects the one closest to its intended direction. In this way, the method reflects how humans visually perceive space, mentally eliminate unsafe directions, and choose a clear path forward.

### Overview

The **Sonar Avoidance Algorithm** is a 1D angular-space local avoidance method.  
Instead of solving constraints directly in velocity space, the algorithm projects obstacles into angular intervals and subtracts blocked regions from the agent’s field of view.

The result is a set of safe steering angles from which the optimal direction is selected.

---

### High-Level Pseudocode

```text
function ComputeSteering(agent):

    desiredDir = GetDesiredDirectionFromNavMesh(agent)
    Θ = [ [-θ_max, 0], [0, θ_max] ]   // two initial vision intervals

    obstacles = CollectObstaclesWithinHorizon(agent)

    blockedIntervals = []

    for each staticObstacle:
        interval = BuildStaticInterval(agent, staticObstacle, desiredDir)
        blockedIntervals.add(interval)

    for each dynamicObstacle:
        interval = BuildDynamicInterval(agent, dynamicObstacle, desiredDir)
        blockedIntervals.add(interval)

    for each wallSegment:
        interval = BuildWallInterval(agent, wallSegment, desiredDir)
        blockedIntervals.add(interval)

    safeIntervals = SubtractIntervals(Θ, blockedIntervals)

    θ* = ArgMinCost(safeIntervals, desiredAngle=0, velocityAngle)

    return DirectionFromAngle(θ*)
```

---

### Agent Model

Each agent is defined as:

- Position: $p_a \in \mathbb{R}^3$
- Velocity: $v_a \in \mathbb{R}^3$
- Radius: $r_a$
- Horizon: $H$
- Preferred speed: $s_a$

From global navigation, the agent receives a desired direction:

$$
d \in \mathbb{R}^3, \quad \|d\| = 1
$$

---

### Angular Space Representation

The angular domain is represented as **two separate intervals**:

$$
\Theta = \{ [-\theta_{max}, 0], \; [0, \theta_{max}] \}
$$

Where:

- $0$ corresponds to desired direction.
- Negative angles represent left.
- Positive angles represent right.

<p align="center">
  <img src="/project-dawn-website/images/sonar-vision.png" width="600" />
  <em>
    Figure 1: The yellow circle represents the agent, and the two green sections represent the sonar detection volume.
  </em>
</p>

---

### Local Space Transformation

All computations are performed in local space where:

- Agent is at origin.
- Desired direction aligns with x-axis.

For any world-space point $p$, local transformation is:

$$
p' = R^{-1}(p - p_a)
$$

Such that:

$$
d' = (1,0,0)
$$

---

### Static Obstacles

Static obstacle:

- Position: $p_o \in \mathbb{R}^3$
- Radius: $r_o$

After transforming to local space:

$$
p_o' = (x, y)
$$

Let:

$$
r = r_a + r_o
$$

Distance to obstacle center:

$$
d = \sqrt{x^2 + y^2}
$$

If $d > H + r$, obstacle is ignored.

Otherwise, we compute its angular span

Central angle:

$$
\theta_c = \text{atan2}(y, x)
$$

Angular half-width:

$$
\Delta \theta = \arcsin\left(\frac{r}{d}\right)
$$

Blocked interval:

$$
[\theta_c - \Delta \theta,\; \theta_c + \Delta \theta]
$$

<p align="center">
  <img src="/project-dawn-website/images/sonar-static-obstacle.png" width="600" />
  <em>
    Figure 2: The red circle represents the obstacle, and the orange circles indicate where the agent would collide if it moved in directions toward the obstacle.
  </em>
</p>

---

### Dynamic Obstacles

Each dynamic obstacle is defined as:

- Position: $p_o \in \mathbb{R}^3$
- Velocity: $v_o \in \mathbb{R}^3$
- Radius: $r_o$

After transforming to agent-local space:

$$
p_o', \quad v_o'
$$

Instead of using fixed agent velocity, we parameterize velocity by steering angle $\theta$:

$$
v_a(\theta) = s_a
\begin{bmatrix}
\cos \theta \\
\sin \theta
\end{bmatrix}
$$

Relative velocity:

$$
v_r(\theta) = v_a(\theta) - v_o'
$$

Relative motion:

$$
p(t) = p_o' + v_r(\theta) t
$$

Collision condition:

$$
\|p_o' + v_r(\theta) t\|^2 = (r_a + r_o)^2
$$

Expanding gives quadratic in time:

$$
a(\theta)t^2 + b(\theta)t + c = 0
$$

Where:

$$
a(\theta) = \|v_r(\theta)\|^2
$$

$$
b(\theta) = 2\, p_o' \cdot v_r(\theta)
$$

$$
c = \|p_o'\|^2 - r^2
$$

Collision exists if discriminant:

$$
D(\theta) = b(\theta)^2 - 4a(\theta)c \ge 0
$$

and smallest positive root:

$$
t_{min}(\theta) > 0
\quad \text{and} \quad
t_{min}(\theta) < \frac{H}{s_a}
$$

All angles $\theta$ satisfying these conditions form a blocked interval in angular space.

Thus dynamic obstacles generate angular intervals directly by solving the quadratic constraint with respect to $\theta$.

<p align="center">
  <img src="/project-dawn-website/images/sonar-dynamic-obstacle.png" width="600" />
  <em>
    Figure 3: The obstacle is moving downward at a speed of 2, and the agent is moving to the right at a speed of 1. The red circles show how the algorithm predicts all possible collision angles. It chooses to move toward the obstacle’s current position because, by the time the agent reaches it, the obstacle will have already moved away.
  </em>
</p>

---

### NavMesh Walls

Each wall segment is defined as:

- Start: $p_s \in \mathbb{R}^3$
- End: $p_e \in \mathbb{R}^3$
- Radius is not required, as a typical NavMesh is already built to account for the agent's radius

After transformation:

$$
p_s', \quad p_e'
$$

The wall is treated as a line segment obstacle.
We compute angular span of both endpoints:

$$
\theta_s = \text{atan2}(y_s, x_s)
$$

$$
\theta_e = \text{atan2}(y_e, x_e)
$$

The span between them (expanded by agent radius) becomes a blocked interval.

<p align="center">
  <img src="/project-dawn-website/images/sonar-wall.png" width="600" />
  <em>
    Figure 1: The yellow circle represents the agent, and red line the navmesh wall.
  </em>
</p>

---

### Interval Subtraction

All blocked intervals are collected:

$$
B = \bigcup_i [\theta_i^{min}, \theta_i^{max}]
$$

Safe space is computed by subtracting blocked intervals from vision space:

$$
S = \Theta \setminus B
$$

Result:

$$
S = \{\text{collision-free steering angles}\}
$$

---

### Direction Selection

From safe intervals $S$, we select optimal angle $\theta^*$.

We define:
- Desired angle: $\theta_d = 0$
- Current velocity angle:

$$
\theta_v = \text{atan2}(v_y, v_x)
$$

Cost function:

$$
C(\theta) =
w_d |\theta - \theta_d|
+
w_v |\theta - \theta_v|
$$

Where:
- $w_d$ controls preference toward goal direction.
- $w_v$ controls smoothness / inertia.

Optimization:

$$
\theta^* = \arg\min_{\theta \in S} C(\theta)
$$

---

### Steering Output

Final steering direction in local space:

$$
d' =
\begin{bmatrix}
\cos \theta^* \\
\sin \theta^*
\end{bmatrix}
$$

Transformed back to world space:

$$
d = R d'
$$

This direction is used for velocity steering.

---

## Complexity Analysis

Let:

- $n_s$ = static obstacles
- $n_d$ = dynamic obstacles
- $n_w$ = wall segments

Interval construction cost:

$$
O(n_s + n_d + n_w)
$$

Interval subtraction (after sorting):

$$
O(k \log k)
$$

Where:

$$
k = n_s + n_d + n_w
$$

Since angular domain is 1D, merging and subtraction are inexpensive compared to 2D linear programming methods.

Total per-agent complexity:

$$
O(k \log k)
$$

In practice, near-linear due to small neighborhood sizes.

---

## Result

### ORCA / RVO

- Operate in full 2D velocity space.
- Construct half-plane constraints.
- Solve linear program per agent.
- Guarantee reciprocal collision avoidance.
- Complexity depends on constraint solving.

### Sonar Avoidance

- Reduces problem to 1D angular space.
- Uses interval subtraction instead of half-plane intersection.
- Avoids linear programming.
- Naturally integrates static geometry and navmesh walls.
- Easier SIMD/ECS optimization.
- Lower constant factors.

Trade-offs:

- Does not guarantee strict reciprocity like ORCA.
- Works best when desired direction dominates behavior.
- More heuristic but computationally simpler.

<div style="display: flex; justify-content: center; gap: 20px; align-items: center;">
  <video width="600" autoplay loop muted playsinline>
    <source src="/project-dawn-website/videos/sonar-circle.mp4" type="video/mp4" />
  </video>

  <video width="600" autoplay loop muted playsinline>
    <source src="/project-dawn-website/videos/rvo-circle.mp4" type="video/mp4" />
  </video>
</div>

<p align="center">
  <em>
    Figure 4: Circling scenario. Yellow agents use Sonar Avoidance to surround the red obstacle and quickly distribute themselves by searching for available openings. The last agent continues circling because no space remains. Blue agents use Unity ORCA and immediately clump on one side of the obstacle instead of attempting a full surround. In both variations, the destination is offset by the combined radii of the agent and the target, and agents stop upon reaching it.
  </em>
</p>

<div style="display: flex; justify-content: center; gap: 20px; align-items: center;">
  <video width="600" autoplay loop muted playsinline>
    <source src="/project-dawn-website/videos/sonar-jail.mp4" type="video/mp4" />
  </video>

  <video width="600" autoplay loop muted playsinline>
    <source src="/project-dawn-website/videos/rvo-jail.mp4" type="video/mp4" />
  </video>
</div>

<p align="center">
  <em>
    Figure 5: Concave blockage scenario. The yellow agent uses Sonar Avoidance and attempts to escape the concave trap. Once its visibility volume reaches the obstacle boundaries, it identifies a valid opening and exits through the left side. The blue agent using Unity ORCA stops near the center of the blockage and fails to escape.
  </em>
</p>

<div style="display: flex; justify-content: center; gap: 20px; align-items: center;">
  <video width="600" autoplay loop muted playsinline>
    <source src="/project-dawn-website/videos/sonar-group.mp4" type="video/mp4" />
  </video>

  <video width="600" autoplay loop muted playsinline>
    <source src="/project-dawn-website/videos/rvo-group.mp4" type="video/mp4" />
  </video>
</div>

<p align="center">
  <em>
    Figure 6: Group exchange scenario. Yellow and green agents use Sonar Avoidance to reach their opposite destinations. Because each agent’s vision is blocked by the entire opposing group, they treat the group as a single large obstacle and flow around it cohesively. Blue agents using Unity ORCA attempt individual pairwise exchanges, resulting in less coordinated movement.
  </em>
</p>

---

## Summary

The Sonar Avoidance Algorithm:

- Projects obstacles into angular space.
- Builds blocked angular intervals.
- Subtracts them from vision domain.
- Minimizes cost to select optimal steering.

It provides an efficient, scalable alternative to velocity obstacle methods while remaining simple to implement and optimize.
