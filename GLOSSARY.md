# Job Tracker

A personal tracker for a job search: which roles you're pursuing, where each one stands, and how the search is going overall.

## Language

### Applications

**Application**:
Your pursuit of one specific role at one Company, from the moment you save the posting until it reaches a final Status. Carries the posting's details (title, description, link, location, pay).
_Avoid_: Job, posting, listing, opportunity, lead

**Company**:
An employer you have one or more Applications with. Applying again to the same Company later, or for a different role, is a new Application under the same Company.
_Avoid_: Employer, organisation, firm

**Source**:
Where you found an Application's posting: LinkedIn, MyCareersFuture, Company website, Referral, Career fair or Other.
_Avoid_: Channel, origin, platform, job board

### Progress

**Status**:
Where an Application currently stands. One of: Saved, Applied, Assessment, Interviewing, Offer, Accepted, Declined, Rejected, Withdrawn. Any Status can follow any other.
_Avoid_: Stage, column, state, phase

**Declined**:
The Status of an Application where you turned down an Offer. Distinct from Withdrawn, which is pulling out before the Company has decided.
_Avoid_: Rejected offer, turned down

**Status Change**:
A dated record that an Application moved to a Status. An Application's Status Changes, in date order, are its history, and the latest one sets its current Status. A mistaken Status Change is corrected by editing or deleting it.
_Avoid_: Event, transition, update, log entry

**Ghosted**:
A label on an Application in Applied, Assessment or Interviewing that has had no Status Change for a set number of days (30 by default). It is not a Status and disappears as soon as anything changes.
_Avoid_: Stale, no response, dead

**Ghosted threshold**:
How many days of silence count as Ghosted, which each job seeker sets for their own search (30 by default). It is never stored on an Application, so changing it relabels them all at once.
_Avoid_: Stale window, cutoff, timeout, expiry

### Hiring process

**Round**:
One dated step in a Company's hiring process for an Application. Every Round is either an Assessment or an Interview.
_Avoid_: Stage, step

**Assessment**:
A Round with no live person from the Company, such as an online assessment, a take-home task or a recorded video interview. Also the name of the Status for an Application whose current Round is an Assessment.
_Avoid_: OA, test, challenge

**Interview**:
A Round that is a live conversation with someone from the Company.
_Avoid_: Call, chat, meeting

### Analytics

**Response**:
A Status Change after Applied that came from the Company: a move to Assessment, Interviewing, Offer or Rejected. Withdrawn and Declined are your own moves, so they are not Responses.
_Avoid_: Reply, callback

**Response Rate**:
The share of Applications that reached Applied and later received a Response.
_Avoid_: Callback rate, hit rate

### Email

**Suggestion**:
A change the app proposes after reading an email, such as a new Status Change, a new Round or a new Application. It takes effect only once you accept it.
_Avoid_: Detection, auto-update, notification, alert
