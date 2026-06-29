# Training

Role-based guides that teach a real person how to use PITMSTR. Each guide is written for one role and assumes no prior knowledge of the platform.

## Pick your role

| If you are a... | Read | You will learn to |
|---|---|---|
| Developer taking over the codebase | [New Developer Onboarding](new-developer.md) | Run it locally, find the key files, make a safe first change, deploy |
| NHSBBQA administrator (Mike's team) | [Admin Training](admin-guide.md) | Run events, manage users and roles, handle billing, generate reports |
| Teacher / coach | [Teacher / Coach Guide](teacher-guide.md) | Register a school and team and compete |
| Judge | [Judge Guide](judge-guide.md) | Scan in, score turn-ins, and submit |
| State director | [State Director Guide](state-director-guide.md) | Manage your state's pages and registrations |

## How these relate to the rest of the docs

The training guides are task-focused: "how do I do X." When you want the underlying detail, follow the links into:

- [Features](../features/index.md): what each part of the product does.
- [Auth & RBAC](../auth-rbac/index.md): how roles and permissions work.
- [Operations](../operations/index.md): running the platform in production.
- [Data Model](../data-model/index.md): the Airtable tables behind everything.

## The roles in one picture

PITMSTR has five roles, enforced through Clerk `publicMetadata`. See [Roles & Permissions](../auth-rbac/roles.md) for the precise definitions.

| Role | Scope | Typical person |
|---|---|---|
| NHSBBQA Admin (Super User) | Everything | Mike Erickson and staff |
| State Director | One state | A state association lead |
| Teacher (School Admin) | One school and its teams | A coach / CTE teacher |
| Student / Parent | Own linked data | A competitor or guardian |
| Public | View-only | Anyone, no login |

Start with the guide for your role above.
