import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function shareArticle(articleId, articleTitle) {
  const baseUrl = window.location.origin;
  const articleLink = `${baseUrl}/articles/${articleId}`;
  
  try {
    // Try to use Clipboard API
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(articleLink);
      return { success: true, message: "Article link copied to clipboard!" };
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = articleLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return { success: true, message: "Article link copied to clipboard!" };
    }
  } catch (error) {
    return { success: false, message: "Failed to copy link" };
  }
}

export async function downloadArticleAsPDF(articleTitle, content, author, category) {
  try {
    const element = document.createElement("div");
    element.style.padding = "20px";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.lineHeight = "1.6";
    element.style.maxWidth = "800px";
    
    // Create header
    const header = document.createElement("div");
    header.style.marginBottom = "30px";
    header.innerHTML = `
      <h1 style="font-size: 24px; margin: 0 0 10px 0;">${articleTitle}</h1>
      <p style="margin: 5px 0; color: #666;">${category || "Uncategorized"}</p>
      <p style="margin: 5px 0; color: #999; font-size: 12px;">By ${author} • ${new Date().toLocaleDateString()}</p>
    `;
    element.appendChild(header);
    
    // Add content
    const contentDiv = document.createElement("div");
    contentDiv.innerHTML = content;
    contentDiv.style.marginTop = "20px";
    element.appendChild(contentDiv);
    
    // Capture as canvas
    document.body.appendChild(element);
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    document.body.removeChild(element);
    
    // Create PDF
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add images to PDF (handle multiple pages)
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= 297; // A4 height
    
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;
    }
    
    // Download PDF
    const filename = `${articleTitle.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    pdf.save(filename);
    
    return { success: true, message: "PDF downloaded successfully!" };
  } catch (error) {
    console.error("PDF generation error:", error);
    return { success: false, message: "Failed to generate PDF" };
  }
}
