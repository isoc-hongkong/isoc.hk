---
wpId: 6677
title: "Important: KSK Rollover"
slug: "important-ksk-rollover"
date: 2018-09-28
modified: 2018-09-28
excerpt: "Please read the below message from HKIRC Subject: ALERT: Urge Action on Root Zone Key Signing Key (KSK) Change (KSK Rollover scheduled on 11 Oct 2018) &#8211; 中文版本隨英文之後 &#8211; Dear Sir/Madam, We are writing to inform you of the schedule of root zone key signing key (“KSK”) change to be conducted by"
description: "Please read the below message from HKIRC Subject: ALERT: Urge Action on Root Zone Key Signing Key (KSK) Change (KSK Rollover scheduled on 11 Oct 2018) &#8211; 中"
categories: ["news"]
tags: []
lang: en
---

## Please read the below message from HKIRC

Subject: ALERT: Urge Action on Root Zone Key Signing Key (KSK) Change (KSK Rollover scheduled on 11 Oct 2018)

- 中文版本隨英文之後 -

Dear Sir/Madam,

We are writing to inform you of the schedule of root zone key signing key (“KSK”) change to be conducted by The Internet Corporation for Assigned Names and Numbers (“ICANN”) in October 2018. ICANN is an accountable and independent global organization striving to ensure a stable and secure global Internet by managing the highest level of the domain name system (DNS) called the root zone. Grateful if you could circulate this email to your members, and business partners so that they can inform their DNS administrators and technical teams to take action and upgrade their systems accordingly to ensure smooth Internet access for users.

Back in 2017, ICANN announced the plan to roll, or change, the “top” pair of cryptographic keys used in the Domain Name System Security Extensions (“DNSSEC”) protocol, commonly known as the root zone key signing key (“KSK”). As every Internet query using DNSSEC depends on the root zone KSK for validating destination, this will be a significant change. Operators of validating resolvers, especially ISPs, shall update their systems with the new key before the rollover takes place. This ensures that when users attempt to visit a website, the resolver would be able to validate queries against the new KSK. ICANN has scheduled the KSK rollover on 11 October 2018.

This is the first time of changing root zone KSK ever since DNSSEC has been enabled in 2010. If you have enabled DNSSEC validation, you must update your system with the new KSK to ensure smooth Internet access for users. Please refer to ICANN’s Quick Guide below for an overview and key milestones:  
[https://www.icann.org/en/system/files/files/ksk-rollover-quick-guide-prepare-systems-25apr18-en.pdf](https://www.icann.org/en/system/files/files/ksk-rollover-quick-guide-prepare-systems-25apr18-en.pdf)

Changing the key involves generating a new cryptographic key pair and distributing the new public component to DNSSEC-validating resolvers. ICANN generated and published the new keys on 11 July 2017. Operators should update at any time prior to the rollover using the new root KSK. However, if you have NOT enabled DNSSEC, your system will not be affected by this rollover.

HKIRC urges all concerned parties to take immediate action on checking whether the systems are ready for the new KSK updates and install the new KSK accordingly.

ICANN has published several guides addressing KSK rollover. Operators of validating resolvers may find the references below useful:

Checking the Current Trust Anchors in DNS Validating Resolvers  
[https://www.icann.org/dns-resolvers-checking-current-trust-anchors](https://www.icann.org/dns-resolvers-checking-current-trust-anchors)

Updating of DNS Validating Resolvers with the Latest Trust Anchor  
[https://www.icann.org/dns-resolvers-updating-latest-trust-anchor](https://www.icann.org/dns-resolvers-updating-latest-trust-anchor)

What To Expect During the Root KSK Rollover  
[https://www.icann.org/en/system/files/files/ksk-rollover-expect-22aug18-en.pdf](https://www.icann.org/en/system/files/files/ksk-rollover-expect-22aug18-en.pdf)

For more details of the Root Zone KSK rollover, please visit <https://www.icann.org/kskroll>

If you have any questions, please contact us at [info@hkirc.hk](mailto:info@hkirc.hk) or +852 2319 2303.

Thank you for your attention.

Sincerely,  
Hong Kong Internet Registration Corporation Limited

Re: 「根區域DNSSEC密鑰簽名密鑰 (KSK) 轉換將定於2018年10月11日」重要通知

您好！

香港互聯網註冊管理有限公司(“HKIRC”) 謹通知貴司互聯網名稱與數字地址分配機構 (“ICANN”) 將定於2018年10月11日進行根區域密鑰簽名密鑰轉換(root zone KSK rollover)。ICANN為一獨立機構，肩負促進全球互聯網域名系統的安全及穩定，並致力保護最頂層的域名系統根部，以確保全球網絡安全。冀望貴司能協助傳遞此重要訊息予會員及各商業伙伴，請他們盡快通知其DNS系統管理員及技術團隊，並檢查及更新系統，為KSK密鑰轉換作好準備，確保用戶瀏覽網頁過程不受影響。

ICANN於2017年開始策劃是次KSK密鑰轉換，乃自2010年推出域名系統安全擴展(“DNSSEC”) KSK 以來首次作出轉換。當中包括在DNSSEC協議中，以最頂層DNS的位置作出密鑰加密（俗稱「根區域KSK」）。如果您已啟動DNSSEC驗證，請盡快透過新的KSK密鑰而進行轉換及更新系統，從而確保用戶瀏覽網頁過程不受影響。請參閱以下ICANN關於KSK密鑰轉換的簡介及重要日子：  
[https://www.icann.org/en/system/files/files/ksk-rollover-quick-guide-prepare-systems-25apr18-en.pdf](https://www.icann.org/en/system/files/files/ksk-rollover-quick-guide-prepare-systems-25apr18-en.pdf)

KSK密鑰轉換是網絡驗證的重要過程，透過一組組的密鑰加密形成新部份，並分散在DNSSEC系統上；每次運用DNSSEC於網上進行查詢時，便會通過根區域KSK來驗證其所在地。當新的KSK密鑰形成後，各互聯網服務供應商便需要使用ICANN提供的新密鑰更新其解析器系統。若您從未啟動DNSSEC，您的解析器系統將不會受到是次ICANN KSK密鑰轉換影響。如欲了解更多關於「根區域 KSK」的資訊及技術指南，請瀏覽[https://www.icann.org/kskroll](https://www.icann.org/kskroll)以及：

查看DNS驗證解析器中的當前信任錨  
[https://www.icann.org/dns-resolvers-checking-current-trust-anchors](https://www.icann.org/dns-resolvers-checking-current-trust-anchors)

使用最新的信任錨更新DNS驗證解析器  
[https://www.icann.org/dns-resolvers-updating-latest-trust-anchor](https://www.icann.org/dns-resolvers-updating-latest-trust-anchor)

KSK轉換全面指南  
[https://www.icann.org/en/system/files/files/ksk-rollover-expect-22aug18-en.pdf](https://www.icann.org/en/system/files/files/ksk-rollover-expect-22aug18-en.pdf)

如有任何查詢，歡迎電郵 [info@hkirc.hk](mailto:info@hkirc.hk) 或致電 +852 2319 2303與我們聯絡。

香港互聯網註冊管理有限公司謹啟