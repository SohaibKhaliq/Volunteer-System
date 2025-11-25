-- Australia comprehensive seeder
-- WARNING: run only on a dev database

SET FOREIGN_KEY_CHECKS=0;

-- types (use enum values already defined in schema)
INSERT INTO `types` (`id`,`type`,`created_at`,`updated_at`) VALUES
(1,'rescue', NOW(), NOW()),
(2,'medical_assistance', NOW(), NOW()),
(3,'food', NOW(), NOW()),
(4,'shelter', NOW(), NOW()),
(5,'other', NOW(), NOW());

-- roles and permissions
INSERT INTO `roles` (`id`,`name`,`description`,`created_at`,`updated_at`) VALUES
(1,'admin','Administrator',NOW(),NOW()),
(2,'volunteer','Volunteer',NOW(),NOW()),
(3,'org_manager','Organization manager',NOW(),NOW());

INSERT INTO `permissions` (`id`,`name`,`description`,`created_at`,`updated_at`) VALUES
(1,'manage_users','Manage users',NOW(),NOW()),
(2,'manage_events','Manage events',NOW(),NOW()),
(3,'view_reports','View reports',NOW(),NOW());

INSERT INTO `role_permissions` (`id`,`role_id`,`permission_id`,`created_at`,`updated_at`) VALUES
(1,1,1,NOW(),NOW()),
(2,1,2,NOW(),NOW()),
(3,1,3,NOW(),NOW()),
(4,3,2,NOW(),NOW());

-- organizations (Australian org examples)
INSERT INTO `organizations` (`id`,`name`,`description`,`contact_email`,`contact_phone`,`is_approved`,`is_active`,`created_at`,`updated_at`) VALUES
(1,'Australian Red Cross','Australian Red Cross - disaster relief and community services','info@redcross.org.au','+61 2 9261 7000',1,1,NOW(),NOW()),
(2,'NSW Rural Fire Service','New South Wales RFS','info@rfs.nsw.gov.au','+61 2 8741 5555',1,1,NOW(),NOW()),
(3,'Salvation Army Australia','Salvation Army Australia - social services','contact@salvationarmy.org.au','+61 131 234',1,1,NOW(),NOW()),
(4,'Lifeline Australia','Lifeline crisis support','support@lifeline.org.au','13 11 14',1,1,NOW(),NOW()),
(5,'SES Victoria','State Emergency Service Victoria','contact@ses.vic.gov.au','+61 3 9310 0000',1,1,NOW(),NOW());

-- users (keep admin id=3 preserved; add Australian volunteers)
INSERT INTO `users` (`id`,`created_at`,`updated_at`,`is_admin`,`email`,`password`,`is_disabled`,`first_name`,`last_name`,`phone`,`last_active_at`,`volunteer_status`,`profile_metadata`) VALUES
(4,NOW(),NOW(),0,'sydney.volunteer1@example.com','password',0,'Oliver','Smith','+61 412 345 678',NOW(),'active',NULL),
(5,NOW(),NOW(),0,'melbourne.volunteer1@example.com','password',0,'Charlotte','Brown','+61 412 345 679',NOW(),'active',NULL),
(6,NOW(),NOW(),0,'brisbane.volunteer1@example.com','password',0,'Jack','Wilson','+61 412 345 680',NOW(),'active',NULL),
(7,NOW(),NOW(),0,'perth.volunteer1@example.com','password',0,'Amelia','Taylor','+61 412 345 681',NOW(),'active',NULL),
(8,NOW(),NOW(),0,'adelaide.volunteer1@example.com','password',0,'Liam','Anderson','+61 412 345 682',NOW(),'active',NULL),
(9,NOW(),NOW(),0,'hobart.volunteer1@example.com','password',0,'Isla','Thomas','+61 412 345 683',NOW(),'active',NULL),
(10,NOW(),NOW(),0,'darwin.volunteer1@example.com','password',0,'Noah','Jackson','+61 412 345 684',NOW(),'active',NULL);

-- assign roles to users
INSERT INTO `user_roles` (`id`,`user_id`,`role_id`,`created_at`,`updated_at`) VALUES
(1,3,1,NOW(),NOW()),
(2,4,2,NOW(),NOW()),
(3,5,2,NOW(),NOW()),
(4,6,2,NOW(),NOW()),
(5,7,2,NOW(),NOW()),
(6,8,2,NOW(),NOW()),
(7,9,2,NOW(),NOW()),
(8,10,2,NOW(),NOW());

-- events in major Australian cities
INSERT INTO `events` (`id`,`organization_id`,`title`,`description`,`location`,`start_at`,`end_at`,`capacity`,`metadata`,`is_published`,`created_at`,`updated_at`) VALUES
(1,1,'Sydney Bushfire Relief','Volunteer support for bushfire affected communities','Sydney, NSW',DATE_ADD(NOW(), INTERVAL 7 DAY),DATE_ADD(NOW(), INTERVAL 9 DAY),100,'{"region":"NSW"}',1,NOW(),NOW()),
(2,2,'NSW RFS Community Preparedness','RFS volunteer training and community awareness','Newcastle, NSW',DATE_ADD(NOW(), INTERVAL 14 DAY),DATE_ADD(NOW(), INTERVAL 14 DAY),50,'{"region":"NSW"}',1,NOW(),NOW()),
(3,3,'Melbourne Food Drive','Food packing and distribution','Melbourne, VIC',DATE_ADD(NOW(), INTERVAL 10 DAY),DATE_ADD(NOW(), INTERVAL 10 DAY),200,'{"region":"VIC"}',1,NOW(),NOW()),
(4,4,'Lifeline Awareness Day','Telephone crisis support training','Brisbane, QLD',DATE_ADD(NOW(), INTERVAL 21 DAY),DATE_ADD(NOW(), INTERVAL 21 DAY),80,'{"region":"QLD"}',1,NOW(),NOW()),
(5,5,'SES Flood Response Drill','SES flood preparedness exercise','Geelong, VIC',DATE_ADD(NOW(), INTERVAL 30 DAY),DATE_ADD(NOW(), INTERVAL 30 DAY),40,'{"region":"VIC"}',1,NOW(),NOW());

-- tasks for events
INSERT INTO `tasks` (`id`,`event_id`,`title`,`description`,`start_at`,`end_at`,`slot_count`,`required_skills`,`metadata`,`created_at`,`updated_at`) VALUES
(1,1,'Food Distribution','Distribute food packs in affected suburbs',DATE_ADD(NOW(), INTERVAL 7 DAY),DATE_ADD(NOW(), INTERVAL 7 DAY),20,'["lifting","driving"]',NULL,NOW(),NOW()),
(2,1,'Shelter Setup','Help set up temporary shelters',DATE_ADD(NOW(), INTERVAL 7 DAY),DATE_ADD(NOW(), INTERVAL 8 DAY),30,'["manual_labor"]',NULL,NOW(),NOW()),
(3,3,'Pack Food Boxes','Pack food boxes for delivery',DATE_ADD(NOW(), INTERVAL 10 DAY),DATE_ADD(NOW(), INTERVAL 10 DAY),50,'["packing"]',NULL,NOW(),NOW()),
(4,4,'Phone Support','Provide crisis-line support (trained volunteers)',DATE_ADD(NOW(), INTERVAL 21 DAY),DATE_ADD(NOW(), INTERVAL 21 DAY),15,'["counselling"]',NULL,NOW(),NOW());

-- assignments (assign volunteers to tasks) - assigned_by is admin id 3
INSERT INTO `assignments` (`id`,`task_id`,`user_id`,`assigned_by`,`status`,`created_at`,`updated_at`) VALUES
(1,1,4,3,'accepted',NOW(),NOW()),
(2,2,5,3,'accepted',NOW(),NOW()),
(3,3,6,3,'accepted',NOW(),NOW()),
(4,4,7,3,'pending',NOW(),NOW());

-- courses and enrollments
INSERT INTO `courses` (`id`,`title`,`description`,`instructor`,`start_at`,`end_at`,`capacity`,`status`,`created_at`,`updated_at`) VALUES
(1,'First Aid (HLTAID011)','Provide First Aid course','Red Cross Trainer',DATE_ADD(NOW(), INTERVAL 5 DAY),DATE_ADD(NOW(), INTERVAL 6 DAY),30,'Open',NOW(),NOW()),
(2,'Volunteer Management','Training for volunteer coordinators','Salvation Army',DATE_ADD(NOW(), INTERVAL 12 DAY),DATE_ADD(NOW(), INTERVAL 12 DAY),25,'Open',NOW(),NOW());

INSERT INTO `course_enrollments` (`id`,`course_id`,`user_id`,`status`,`progress`,`completed_at`,`created_at`,`updated_at`) VALUES
(1,1,4,'Enrolled',0,NULL,NOW(),NOW()),
(2,2,5,'Enrolled',0,NULL,NOW(),NOW());

-- offers and offer_types
INSERT INTO `offers` (`id`,`longitude`,`latitude`,`address`,`description`,`status`,`name`,`phone`,`email`,`is_on_site`,`user_id`,`created_at`,`updated_at`,`files`) VALUES
(1,-33.868800,-33.868800,'Sydney CBD, NSW','Offer to host collection centre','planned','Collection Hub','+61 412 000 000','hub@sydney.org',1,4,NOW(),NOW(),'[]'),
(2,-37.813600,-37.813600,'Melbourne CBD, VIC','Offer transport trucks for distribution','planned','Transport Vehicle','+61 412 000 001','logistics@melbourne.org',1,5,NOW(),NOW(),'[]');

INSERT INTO `offer_types` (`id`,`offer_id`,`type_id`,`created_at`,`updated_at`) VALUES
(1,1,3,NOW(),NOW()),
(2,2,3,NOW(),NOW());

-- resources
INSERT INTO `resources` (`id`,`name`,`quantity`,`status`,`organization_id`,`created_at`,`updated_at`) VALUES
(1,'Blankets',500,'Available',1,NOW(),NOW()),
(2,'Water Bottles',2000,'Available',3,NOW(),NOW()),
(3,'Tents',150,'Available',2,NOW(),NOW());

-- help requests and types
INSERT INTO `help_requests` (`id`,`longitude`,`latitude`,`address`,`description`,`source`,`status`,`name`,`phone`,`email`,`is_on_site`,`user_id`,`created_at`,`updated_at`,`files`) VALUES
(1,-33.856800,-33.856800,'Circular Quay, Sydney','Family requires food and water','community','requested','Mrs Harris','+61 400 000 001','harris@example.com',1,NULL,NOW(),NOW(),'[]'),
(2,-37.840900,-37.840900,'Docklands, Melbourne','House flooded, need assistance','community','requested','Mr Lee','+61 400 000 002','lee@example.com',1,NULL,NOW(),NOW(),'[]');

INSERT INTO `help_request_types` (`id`,`help_request_id`,`type_id`,`created_at`,`updated_at`) VALUES
(1,1,3,NOW(),NOW()),
(2,2,4,NOW(),NOW());

-- surveys and responses
INSERT INTO `surveys` (`id`,`title`,`description`,`status`,`created_at`,`updated_at`) VALUES
(1,'Volunteer Satisfaction Survey','Short survey after event','Open',NOW(),NOW());

INSERT INTO `survey_responses` (`id`,`survey_id`,`user_id`,`answers`,`created_at`) VALUES
(1,1,4,'{"q1":"very_satisfied","q2":"yes"}',NOW());

-- volunteer hours
INSERT INTO `volunteer_hours` (`id`,`user_id`,`event_id`,`date`,`hours`,`status`,`created_at`,`updated_at`) VALUES
(1,4,1,DATE_SUB(CURDATE(), INTERVAL 1 DAY),4.00,'Approved',NOW(),NOW()),
(2,5,3,CURDATE(),3.50,'Pending',NOW(),NOW());

SET FOREIGN_KEY_CHECKS=1;

-- End of seeder
